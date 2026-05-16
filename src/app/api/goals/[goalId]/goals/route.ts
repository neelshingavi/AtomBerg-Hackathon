import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { editableStatuses, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { isGoalSettingOpen } from "@/lib/cycle";
import { validateWeightage } from "@/lib/calculations/weightage";
import { goalInputSchema } from "@/lib/validations/goal.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

/** Add a goal to an existing sheet (`goalId` = sheet id). */
export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId: sheetId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = goalInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { cycle: true, goals: true },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (sheet.employeeId !== session.user.id && session.user.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }

  if (!editableStatuses().includes(sheet.status)) {
    return apiError(`Cannot add goals when sheet status is ${sheet.status}`, 400);
  }

  if (!isGoalSettingOpen(sheet.cycle)) {
    return apiError("Goal setting window is not open", 403);
  }

  if (sheet.goals.length >= 8) {
    return apiError("Maximum 8 goals per sheet", 400);
  }

  const weightageCheck = validateWeightage([
    ...sheet.goals.map((g) => ({ title: g.title, weightage: g.weightage })),
    { title: parsed.data.title, weightage: parsed.data.weightage },
  ]);
  if (!weightageCheck.isValid) {
    return apiError(weightageCheck.errors.join("; "));
  }

  if (weightageCheck.totalWeightage > 100) {
    return apiError(
      `Total weightage cannot exceed 100%. Would be ${weightageCheck.totalWeightage.toFixed(1)}%.`
    );
  }

  const goal = await prisma.goal.create({
    data: {
      goalSheetId: sheetId,
      thrustAreaId: parsed.data.thrustAreaId,
      title: parsed.data.title,
      description: parsed.data.description,
      uomType: parsed.data.uomType,
      plannedTarget: parsed.data.plannedTarget,
      targetDeadline: parsed.data.targetDeadline ?? undefined,
      unit: parsed.data.unit,
      weightage: parsed.data.weightage,
      order: sheet.goals.length + 1,
    },
    include: { thrustArea: { select: { id: true, name: true, color: true } } },
  });

  await writeAuditLog({
    action: "CREATED",
    entityType: "Goal",
    entityId: goal.id,
    createdById: session.user.id,
    affectedUserId: sheet.employeeId,
    goalSheetId: sheetId,
    newValues: { title: goal.title, weightage: goal.weightage },
  });

  const updated = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: goalSheetInclude,
  });

  return apiSuccess({ goal, goalSheet: serializeGoalSheet(updated!) }, 201);
}
