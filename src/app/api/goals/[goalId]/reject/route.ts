import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { rejectSheetSchema } from "@/lib/validations/goal.schema";
import { createNotification, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { sendGoalRejectedEmail } from "@/lib/email/resend";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  const { goalId: goalSheetId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = rejectSheetSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { employee: true, cycle: true },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (session.user.role === "MANAGER" && sheet.managerId !== session.user.id) {
    return apiError("Forbidden", 403);
  }

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(sheet.status)) {
    return apiError(`Cannot reject sheet with status ${sheet.status}`, 400);
  }

  const updated = await prisma.goalSheet.update({
    where: { id: goalSheetId },
    data: {
      status: "REWORK",
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
      submittedAt: null,
      rejectedAt: new Date(),
      managerNote: parsed.data.managerNote,
    },
    include: goalSheetInclude,
  });

  await writeAuditLog({
    action: "REJECTED",
    entityType: "GoalSheet",
    entityId: goalSheetId,
    createdById: session.user.id,
    affectedUserId: sheet.employeeId,
    goalSheetId,
    previousValues: { status: sheet.status },
    newValues: { status: "REWORK" },
    metadata: { managerNote: parsed.data.managerNote },
    ipAddress: getRequestIp(req),
  });

  await createNotification({
    userId: sheet.employeeId,
    type: "GOAL_REJECTED",
    title: "Goals returned for rework",
    message: parsed.data.managerNote,
    link: `/employee/goals/${goalSheetId}`,
  });

  try {
    await sendGoalRejectedEmail({
      employeeEmail: sheet.employee.email,
      employeeName: sheet.employee.name,
      managerName: session.user.name ?? "Your manager",
      managerNote: parsed.data.managerNote,
      sheetId: goalSheetId,
    });
  } catch (e) {
    console.error("[reject] email failed:", e);
  }

  return apiSuccess({ goalSheet: serializeGoalSheet(updated) });
}
