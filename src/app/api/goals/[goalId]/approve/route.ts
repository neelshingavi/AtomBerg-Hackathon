import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { createDiff, writeAuditLog } from "@/lib/audit";
import { validateSubmission } from "@/lib/calculations/weightage";
import { approveSheetSchema } from "@/lib/validations/goal.schema";
import { createNotification, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { sendGoalApprovedEmail } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  const { goalId: goalSheetId } = await context.params;

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = approveSheetSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { goals: true, employee: true, cycle: true },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (
    session.user.role === "MANAGER" &&
    sheet.managerId !== session.user.id
  ) {
    return apiError("Forbidden", 403);
  }

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(sheet.status)) {
    return apiError(`Cannot approve sheet with status ${sheet.status}`, 400);
  }

  const { managerNote, inlineEdits } = parsed.data;

  if (inlineEdits?.length) {
    for (const edit of inlineEdits) {
      const goal = sheet.goals.find((g) => g.id === edit.goalId);
      if (!goal) return apiError(`Goal ${edit.goalId} not found on sheet`, 400);

      const previous = {
        weightage: goal.weightage,
        plannedTarget: goal.plannedTarget,
        title: goal.title,
        description: goal.description,
      };

      await prisma.goal.update({
        where: { id: edit.goalId },
        data: {
          weightage: edit.weightage,
          plannedTarget: edit.plannedTarget,
          title: edit.title,
          description: edit.description,
        },
      });

      const diff = createDiff(previous as Record<string, unknown>, {
        weightage: edit.weightage ?? goal.weightage,
        plannedTarget: edit.plannedTarget ?? goal.plannedTarget,
        title: edit.title ?? goal.title,
        description: edit.description ?? goal.description,
      });

      if (Object.keys(diff.next).length > 0) {
        await writeAuditLog({
          action: "UPDATED",
          entityType: "Goal",
          entityId: edit.goalId,
          createdById: session.user.id,
          affectedUserId: sheet.employeeId,
          goalSheetId,
          previousValues: diff.prev,
          newValues: diff.next,
          metadata: { inlineEdit: true },
        });
      }
    }
  }

  const refreshedGoals = await prisma.goal.findMany({ where: { goalSheetId } });
  const validation = validateSubmission(
    refreshedGoals.map((g) => ({ title: g.title, weightage: g.weightage }))
  );
  if (!validation.isValid) {
    return apiError(validation.errors.join("; "));
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.goalSheet.update({
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
      include: goalSheetInclude,
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
      metadata: { managerNote },
    });

    return result;
  });

  await createNotification({
    userId: sheet.employeeId,
    type: "GOAL_APPROVED",
    title: "Goals approved",
    message: `Your goal sheet for ${sheet.cycle.name} has been approved and locked.`,
    link: `/employee/goals/${goalSheetId}`,
  });

  try {
    await sendGoalApprovedEmail({
      employeeEmail: sheet.employee.email,
      employeeName: sheet.employee.name,
      managerName: session.user.name ?? "Your manager",
      cycleName: sheet.cycle.name,
      sheetId: goalSheetId,
    });
  } catch (e) {
    console.error("[approve] email failed:", e);
  }

  return apiSuccess({ goalSheet: serializeGoalSheet(updated) });
}
