import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { createNotification } from "@/lib/goals";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  goalSheetIds: z.array(z.string()).min(1).max(50),
  managerNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { goalSheetIds, managerNote } = parsed.data;
  const clientIp = getRequestIp(req);

  const { approved, failed, approvable } = await prisma.$transaction(async (tx) => {
    const approved: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    const sheets = await tx.goalSheet.findMany({
      where: { id: { in: goalSheetIds } },
      include: { employee: true, cycle: true },
    });

    const sheetById = new Map(sheets.map((s) => [s.id, s]));
    const approvable: typeof sheets = [];

    for (const goalSheetId of goalSheetIds) {
      const sheet = sheetById.get(goalSheetId);
      if (!sheet) {
        failed.push({ id: goalSheetId, reason: "Not found" });
        continue;
      }

      if (session.user.role === "MANAGER" && sheet.managerId !== session.user.id) {
        failed.push({ id: goalSheetId, reason: "Forbidden" });
        continue;
      }

      if (!["SUBMITTED", "UNDER_REVIEW"].includes(sheet.status)) {
        failed.push({ id: goalSheetId, reason: `Invalid status ${sheet.status}` });
        continue;
      }

      approvable.push(sheet);
    }

    if (approvable.length > 0) {
      const now = new Date();
      const approvableIds = approvable.map((s) => s.id);

      await tx.goalSheet.updateMany({
        where: { id: { in: approvableIds } },
        data: {
          status: "APPROVED",
          isLocked: true,
          lockedAt: now,
          lockedBy: session.user.id,
          approvedAt: now,
          ...(managerNote !== undefined ? { managerNote } : {}),
        },
      });

      await tx.auditLog.createMany({
        data: approvable.map((s) => ({
          action: "APPROVED" as const,
          entityType: "GoalSheet",
          entityId: s.id,
          createdById: session.user.id,
          affectedUserId: s.employeeId,
          goalSheetId: s.id,
          previousValues: { status: s.status, isLocked: s.isLocked },
          newValues: { status: "APPROVED", isLocked: true },
          metadata: { bulk: true, managerNote },
          ipAddress: clientIp,
        })),
      });

      approved.push(...approvableIds);
    }

    return { approved, failed, approvable };
  });

  for (const sheet of approvable) {
    await createNotification({
      userId: sheet.employeeId,
      type: "GOAL_APPROVED",
      title: "Goals approved",
      message: `Your goal sheet for ${sheet.cycle.name} has been approved.`,
      link: `/employee/goals/${sheet.id}`,
    });
  }

  return apiSuccess({ approved, failed });
}
