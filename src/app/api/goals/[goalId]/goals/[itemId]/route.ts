import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { editableStatuses } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string; itemId: string }> };

/** Remove a goal from a sheet (`goalId` = sheet id). */
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId: sheetId, itemId } = await context.params;

  const goal = await prisma.goal.findUnique({
    where: { id: itemId },
    include: { goalSheet: true },
  });

  if (!goal || goal.goalSheetId !== sheetId) {
    return apiError("Goal not found", 404);
  }

  const sheet = goal.goalSheet;
  if (sheet.employeeId !== session.user.id && session.user.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }

  if (!editableStatuses().includes(sheet.status)) {
    return apiError(`Cannot delete goals when sheet status is ${sheet.status}`, 400);
  }

  if (goal.isShared) {
    return apiError("Cannot delete shared goals from your sheet", 400);
  }

  await prisma.goal.delete({ where: { id: itemId } });

  await writeAuditLog({
    action: "UPDATED",
    entityType: "Goal",
    entityId: itemId,
    createdById: session.user.id,
    affectedUserId: sheet.employeeId,
    goalSheetId: sheetId,
    previousValues: { title: goal.title, weightage: goal.weightage },
  });

  return apiSuccess({ deleted: true });
}
