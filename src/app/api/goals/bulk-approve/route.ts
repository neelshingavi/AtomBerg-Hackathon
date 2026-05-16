import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
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
  const approved: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const goalSheetId of goalSheetIds) {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { employee: true, cycle: true },
    });

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

    await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: {
        status: "APPROVED",
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: session.user.id,
        approvedAt: new Date(),
        managerNote: managerNote ?? sheet.managerNote,
        reviewedAt: sheet.reviewedAt ?? new Date(),
      },
    });

    await writeAuditLog({
      action: "APPROVED",
      entityType: "GoalSheet",
      entityId: goalSheetId,
      createdById: session.user.id,
      affectedUserId: sheet.employeeId,
      goalSheetId,
      previousValues: { status: sheet.status, isLocked: sheet.isLocked },
      newValues: { status: "APPROVED", isLocked: true },
      metadata: { managerNote, bulk: true },
      ipAddress: clientIp,
    });

    await createNotification({
      userId: sheet.employeeId,
      type: "GOAL_APPROVED",
      title: "Goals approved",
      message: `Your goal sheet for ${sheet.cycle.name} has been approved.`,
      link: `/employee/goals/${goalSheetId}`,
    });

    approved.push(goalSheetId);
  }

  return apiSuccess({ approved, failed });
}
