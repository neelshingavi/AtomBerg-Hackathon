import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { createDiff, writeAuditLog } from "@/lib/audit";
import { patchGoalSchema } from "@/lib/validations/goal.schema";
import { editableStatuses, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId } = await context.params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalId },
    include: goalSheetInclude,
  });

  if (!sheet) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { goalSheet: { include: goalSheetInclude } },
    });
    if (!goal) return apiError("Not found", 404);
    return apiSuccess({ goal });
  }

  if (session.user.role === "EMPLOYEE" && sheet.employeeId !== session.user.id) {
    return apiError("Forbidden", 403);
  }
  if (session.user.role === "MANAGER" && sheet.managerId !== session.user.id) {
    return apiError("Forbidden", 403);
  }

  return apiSuccess({ goalSheet: serializeGoalSheet(sheet) });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = patchGoalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { goalSheet: true },
  });
  if (!goal) return apiError("Goal not found", 404);

  const sheet = goal.goalSheet;
  const isOwner = sheet.employeeId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isManager =
    session.user.role === "MANAGER" && sheet.managerId === session.user.id;

  if (!isOwner && !isAdmin && !isManager) {
    return apiError("Forbidden", 403);
  }

  if (sheet.isLocked && !isAdmin) {
    return apiError("Goal sheet is locked", 403);
  }

  if (!editableStatuses().includes(sheet.status) && !isAdmin) {
    return apiError(`Cannot edit goals when sheet status is ${sheet.status}`, 403);
  }

  const data = parsed.data;

  if (goal.isTitleLocked && data.title !== undefined && !isAdmin) {
    return apiError("Cannot edit title of shared goal");
  }
  if (goal.isTargetLocked && data.plannedTarget !== undefined && !isAdmin) {
    return apiError("Cannot edit target of shared goal");
  }
  if (goal.isShared && isOwner && !isAdmin) {
    const allowedKeys = new Set(["weightage"]);
    const keys = Object.keys(data);
    if (keys.some((k) => !allowedKeys.has(k))) {
      return apiError("Shared goals only allow weightage edits");
    }
  }

  const previous = {
    title: goal.title,
    description: goal.description,
    uomType: goal.uomType,
    plannedTarget: goal.plannedTarget,
    targetDeadline: goal.targetDeadline,
    unit: goal.unit,
    weightage: goal.weightage,
  };

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: {
      title: data.title,
      description: data.description,
      uomType: data.uomType,
      plannedTarget: data.plannedTarget,
      targetDeadline: data.targetDeadline,
      unit: data.unit,
      weightage: data.weightage,
    },
    include: {
      thrustArea: { select: { id: true, name: true, color: true } },
    },
  });

  if (sheet.isLocked && isAdmin) {
    const diff = createDiff(previous as Record<string, unknown>, {
      title: updated.title,
      description: updated.description,
      uomType: updated.uomType,
      plannedTarget: updated.plannedTarget,
      targetDeadline: updated.targetDeadline,
      unit: updated.unit,
      weightage: updated.weightage,
    });
    await writeAuditLog({
      action: "UPDATED",
      entityType: "Goal",
      entityId: goalId,
      createdById: session.user.id,
      affectedUserId: sheet.employeeId,
      goalSheetId: sheet.id,
      previousValues: diff.prev,
      newValues: diff.next,
    });
  }

  return apiSuccess({ goal: updated });
}
