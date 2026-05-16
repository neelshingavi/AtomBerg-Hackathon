import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { calculateProgress } from "@/lib/calculations/progress";
import { isQuarterWindowOpen, type Quarter } from "@/lib/cycle";
import {
  achievementBatchSchema,
  achievementInputSchema,
} from "@/lib/validations/achievement.schema";
import { syncSharedGoalAchievement } from "@/lib/shared-goal-sync";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const goalSheetId = req.nextUrl.searchParams.get("goalSheetId");
  const quarter = req.nextUrl.searchParams.get("quarter");

  if (!goalSheetId) {
    return apiError("goalSheetId is required");
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: {
      goals: {
        include: {
          achievements: quarter ? { where: { quarter } } : true,
          thrustArea: { select: { name: true, color: true } },
        },
        orderBy: { order: "asc" },
      },
      cycle: true,
    },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (session.user.role === "EMPLOYEE" && sheet.employeeId !== session.user.id) {
    return apiError("Forbidden", 403);
  }
  if (
    session.user.role === "MANAGER" &&
    sheet.managerId !== session.user.id
  ) {
    return apiError("Forbidden", 403);
  }
  // ADMIN may view all sheets

  return apiSuccess({
    goalSheet: sheet,
    quarterWindows: {
      Q1: isQuarterWindowOpen(sheet.cycle, "Q1"),
      Q2: isQuarterWindowOpen(sheet.cycle, "Q2"),
      Q3: isQuarterWindowOpen(sheet.cycle, "Q3"),
      Q4: isQuarterWindowOpen(sheet.cycle, "Q4"),
    },
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const isBatch = typeof body === "object" && body !== null && "achievements" in body;

  if (isBatch) {
    const parsed = achievementBatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues.map((i) => i.message).join("; "));
    }
    return saveBatch(session.user.id, parsed.data);
  }

  const parsed = achievementInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const result = await upsertAchievement(session.user.id, parsed.data);
  if ("error" in result) return result.error;
  return apiSuccess({ achievement: result.achievement });
}

async function saveBatch(
  userId: string,
  data: {
    goalSheetId: string;
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    cycleId: string;
    achievements: Array<{
      goalId: string;
      actualValue?: number | null;
      completionDate?: Date | null;
      status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED";
      remark?: string | null;
    }>;
  }
) {
  const results = [];
  for (const item of data.achievements) {
    const result = await upsertAchievement(userId, {
      ...item,
      quarter: data.quarter,
      cycleId: data.cycleId,
    });
    if ("error" in result) return result.error;
    results.push(result.achievement);
  }
  return apiSuccess({ achievements: results });
}

async function upsertAchievement(
  userId: string,
  data: {
    goalId: string;
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    cycleId: string;
    actualValue?: number | null;
    completionDate?: Date | null;
    status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED";
    remark?: string | null;
  }
) {
  const goal = await prisma.goal.findUnique({
    where: { id: data.goalId },
    include: {
      goalSheet: {
        include: {
          cycle: true,
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!goal) return { error: apiError("Goal not found", 404) };

  if (goal.goalSheet.employeeId !== userId) {
    return { error: apiError("Forbidden", 403) };
  }

  if (!goal.goalSheet.isLocked || goal.goalSheet.status !== "APPROVED") {
    return {
      error: apiError("Achievements can only be logged after goals are approved and locked", 403),
    };
  }

  if (goal.goalSheet.cycleId !== data.cycleId) {
    return { error: apiError("Cycle mismatch", 400) };
  }

  if (!isQuarterWindowOpen(goal.goalSheet.cycle, data.quarter as Quarter)) {
    return {
      error: apiError(`${data.quarter} check-in window is not open`, 403),
    };
  }

  const progress = calculateProgress({
    uomType: goal.uomType,
    plannedTarget: goal.plannedTarget,
    actualValue: data.actualValue,
    targetDeadline: goal.targetDeadline,
    completionDate: data.completionDate,
  });

  const achievement = await prisma.achievement.upsert({
    where: { goalId_quarter: { goalId: data.goalId, quarter: data.quarter } },
    update: {
      actualValue: data.actualValue,
      completionDate: data.completionDate,
      status: data.status,
      progressScore: progress.score,
      remark: data.remark,
    },
    create: {
      goalId: data.goalId,
      quarter: data.quarter,
      cycleId: data.cycleId,
      actualValue: data.actualValue,
      completionDate: data.completionDate,
      status: data.status,
      progressScore: progress.score,
      remark: data.remark,
    },
  });

  await syncSharedGoalAchievement(
    data.goalId,
    data.quarter,
    {
      cycleId: data.cycleId,
      actualValue: data.actualValue,
      completionDate: data.completionDate,
      status: data.status,
      progressScore: progress.score,
      remark: data.remark,
    },
    goal.goalSheet.employee.name
  );

  await writeAuditLog({
    action: "ACHIEVEMENT_LOGGED",
    entityType: "Achievement",
    entityId: achievement.id,
    createdById: userId,
    affectedUserId: userId,
    goalSheetId: goal.goalSheetId,
    newValues: {
      quarter: data.quarter,
      actualValue: data.actualValue,
      progressScore: progress.score,
      status: data.status,
    },
  });

  return {
    achievement: {
      ...achievement,
      progress,
    },
  };
}
