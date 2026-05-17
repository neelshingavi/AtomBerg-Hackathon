import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { editableStatuses, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string; itemId: string }> };

/** Remove a goal from a sheet (`goalId` = sheet id). */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId: sheetId, itemId: goalId } = await context.params;

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheetId !== sheetId) {
    return apiError("Goal not found", 404);
  }

  const sheet = goal.goalSheet;
  const isOwner = sheet.employeeId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return apiError("Forbidden", 403);
  }

  if (sheet.isLocked && !isAdmin) {
    return apiError("Cannot delete goal from locked sheet", 403);
  }

  if (!editableStatuses().includes(sheet.status) && !isAdmin) {
    return apiError(`Cannot delete goals when sheet status is ${sheet.status}`, 400);
  }

  if (goal.isShared) {
    return apiError("Cannot delete a shared goal from your sheet", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.goal.delete({ where: { id: goalId } });

    await writeAuditLog(
      {
        action: "UPDATED",
        entityType: "Goal",
        entityId: goalId,
        createdById: session.user.id,
        affectedUserId: sheet.employeeId,
        goalSheetId: sheetId,
        previousValues: { title: goal.title, weightage: goal.weightage },
        newValues: { deleted: true },
        metadata: isAdmin ? { adminOverride: true } : undefined,
      },
      tx
    );
  });

  const updated = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: goalSheetInclude,
  });

  if (!updated) return apiError("Goal sheet not found", 404);

  return apiSuccess({ goalSheet: serializeGoalSheet(updated) });
}
