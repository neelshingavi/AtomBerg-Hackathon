import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentPhase } from "@/lib/cycle";
import { validateWeightage } from "@/lib/calculations/weightage";
import { createGoalSheetSchema } from "@/lib/validations/goal.schema";
import { goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { prisma } from "@/lib/prisma";
import type { GoalStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const cycleId = searchParams.get("cycleId") ?? undefined;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const status = (searchParams.get("status") as GoalStatus | null) ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const where: Prisma.GoalSheetWhereInput = {};

  if (cycleId) where.cycleId = cycleId;
  if (status) where.status = status;

  const role = session.user.role;

  if (role === "EMPLOYEE") {
    where.employeeId = session.user.id;
  } else if (role === "MANAGER") {
    if (employeeId) {
      where.employeeId = employeeId;
      where.managerId = session.user.id;
    } else {
      where.managerId = session.user.id;
    }
  } else if (role === "ADMIN") {
    if (employeeId) where.employeeId = employeeId;
  } else {
    return apiError("Forbidden", 403);
  }

  const [total, goalSheets] = await Promise.all([
    prisma.goalSheet.count({ where }),
    prisma.goalSheet.findMany({
      where,
      include: goalSheetInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return apiSuccess({
    goalSheets: goalSheets.map(serializeGoalSheet),
    pagination: { page, limit, total },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["EMPLOYEE", "ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = createGoalSheetSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { cycleId, goals } = parsed.data;
  const employeeId = session.user.role === "ADMIN" && (body as { employeeId?: string }).employeeId
    ? (body as { employeeId: string }).employeeId
    : session.user.id;

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return apiError("Cycle not found", 404);

  if (getCurrentPhase(cycle) !== "GOAL_SETTING") {
    return apiError("Goal setting window is not open for this cycle", 403);
  }

  const existing = await prisma.goalSheet.findUnique({
    where: { employeeId_cycleId: { employeeId, cycleId } },
  });
  if (existing) {
    return apiError("You already have a goal sheet for this cycle", 409);
  }

  const weightageCheck = validateWeightage(
    goals.map((g) => ({ title: g.title, weightage: g.weightage }))
  );
  if (!weightageCheck.isValid) {
    return apiError(weightageCheck.errors.join("; "));
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { managerId: true },
  });
  if (!employee) return apiError("Employee not found", 404);

  const sheet = await prisma.$transaction(async (tx) => {
    const created = await tx.goalSheet.create({
      data: {
        employeeId,
        managerId: employee.managerId,
        cycleId,
        status: "DRAFT",
        goals: {
          create: goals.map((g, index) => ({
            thrustAreaId: g.thrustAreaId,
            title: g.title,
            description: g.description,
            uomType: g.uomType,
            plannedTarget: g.plannedTarget,
            targetDeadline: g.targetDeadline ?? undefined,
            unit: g.unit,
            weightage: g.weightage,
            order: index + 1,
          })),
        },
      },
      include: goalSheetInclude,
    });

    await writeAuditLog({
      action: "CREATED",
      entityType: "GoalSheet",
      entityId: created.id,
      createdById: session.user.id,
      affectedUserId: employeeId,
      goalSheetId: created.id,
      newValues: { status: "DRAFT", goalsCount: goals.length },
    });

    return created;
  });

  return apiSuccess({ goalSheet: serializeGoalSheet(sheet) }, 201);
}
