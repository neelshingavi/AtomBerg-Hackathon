import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { sharedGoalPushSchema } from "@/lib/validations/goal.schema";
import { createNotification, editableStatuses } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const where =
    session.user.role === "ADMIN"
      ? {}
      : session.user.role === "MANAGER"
        ? { pushedById: session.user.id }
        : {
            goals: {
              some: { goalSheet: { employeeId: session.user.id } },
            },
          };

  const sharedGoals = await prisma.sharedGoal.findMany({
    where: { isActive: true, ...where },
    include: {
      goals: {
        include: {
          goalSheet: {
            select: {
              employeeId: true,
              employee: { select: { name: true, employeeCode: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ sharedGoals });
}

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

  const parsed = sharedGoalPushSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const data = parsed.data;
  const results: Array<{ employeeId: string; goalSheetId: string; goalId: string }> = [];

  await prisma.$transaction(async (tx) => {
    const sharedGoal = await tx.sharedGoal.create({
      data: {
        title: data.title,
        description: data.description,
        uomType: data.uomType,
        plannedTarget: data.plannedTarget,
        targetDeadline: data.targetDeadline ?? undefined,
        unit: data.unit,
        thrustAreaId: data.thrustAreaId,
        cycleId: data.cycleId,
        pushedById: session.user.id,
      },
    });

    for (const employeeId of data.targetEmployeeIds) {
      if (session.user.role === "MANAGER") {
        const report = await tx.user.findFirst({
          where: { id: employeeId, managerId: session.user.id },
        });
        if (!report) continue;
      }

      let sheet = await tx.goalSheet.findUnique({
        where: { employeeId_cycleId: { employeeId, cycleId: data.cycleId } },
        include: { goals: true },
      });

      if (!sheet) {
        const employee = await tx.user.findUnique({
          where: { id: employeeId },
          select: { managerId: true },
        });
        if (!employee) continue;

        sheet = await tx.goalSheet.create({
          data: {
            employeeId,
            managerId: employee.managerId,
            cycleId: data.cycleId,
            status: "DRAFT",
          },
          include: { goals: true },
        });
      }

      if (sheet.isLocked || !editableStatuses().includes(sheet.status)) {
        continue;
      }

      if (sheet.goals.length >= 8) continue;

      const newTotal = sheet.goals.reduce((s, g) => s + g.weightage, 0) + data.defaultWeightage;
      if (newTotal > 100) continue;

      const goal = await tx.goal.create({
        data: {
          goalSheetId: sheet.id,
          thrustAreaId: data.thrustAreaId,
          title: data.title,
          description: data.description,
          uomType: data.uomType,
          plannedTarget: data.plannedTarget,
          targetDeadline: data.targetDeadline ?? undefined,
          unit: data.unit,
          weightage: data.defaultWeightage,
          order: sheet.goals.length + 1,
          isShared: true,
          sharedGoalId: sharedGoal.id,
          isTitleLocked: true,
          isTargetLocked: true,
        },
      });

      results.push({ employeeId, goalSheetId: sheet.id, goalId: goal.id });

      await createNotification({
        userId: employeeId,
        type: "SHARED_GOAL_PUSHED",
        title: "New shared goal assigned",
        message: `A shared goal "${data.title}" was added to your sheet.`,
        link: `/employee/goals/${sheet.id}`,
      });
    }

    await writeAuditLog({
      action: "SHARED_GOAL_PUSHED",
      entityType: "SharedGoal",
      entityId: sharedGoal.id,
      createdById: session.user.id,
      newValues: { title: data.title, targetCount: results.length },
    });
  });

  return apiSuccess({ pushed: results }, 201);
}
