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
import type { Prisma } from "@prisma/client";

type AchievementDb = Pick<typeof prisma, "goal" | "achievement" | "auditLog">;

type AchievementInput = {
  goalId: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  cycleId: string;
  actualValue?: number | null;
  completionDate?: Date | null;
  status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED";
  remark?: string | null;
};

type GoalWithSheet = Prisma.GoalGetPayload<{
  include: {
    goalSheet: {
      include: {
        cycle: true;
        employee: { select: { id: true; name: true } };
      };
    };
  };
}>;

type PreparedAchievement = {
  goal: GoalWithSheet;
  data: AchievementInput;
  progress: ReturnType<typeof calculateProgress>;
};

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

  const prepared = await prepareAchievement(session.user.id, parsed.data);
  if ("error" in prepared) return prepared.error;

  const result = await prisma.$transaction(async (tx) =>
    commitAchievementUpsert(tx, session.user.id, prepared)
  );

  const { bumpRealtimeVersion } = await import("@/lib/realtime/events");
  await bumpRealtimeVersion("achievement_logged");

  return apiSuccess({ achievement: result });
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
  const goals = await prisma.goal.findMany({
    where: { id: { in: data.achievements.map((a) => a.goalId) } },
    include: {
      goalSheet: {
        include: {
          cycle: true,
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  const goalById = new Map(goals.map((g) => [g.id, g]));
  const prepared: PreparedAchievement[] = [];

  for (const item of data.achievements) {
    const goal = goalById.get(item.goalId);
    const validation = validateAchievementInput(userId, goal, {
      ...item,
      quarter: data.quarter,
      cycleId: data.cycleId,
    });
    if ("error" in validation) return validation.error;
    prepared.push(validation);
  }

  const results = await prisma.$transaction(async (tx) => {
    const committed = [];
    for (const entry of prepared) {
      committed.push(await commitAchievementUpsert(tx, userId, entry));
    }
    return committed;
  });

  const { bumpRealtimeVersion } = await import("@/lib/realtime/events");
  await bumpRealtimeVersion("achievement_logged");

  return apiSuccess({ achievements: results });
}

async function prepareAchievement(
  userId: string,
  data: AchievementInput
): Promise<PreparedAchievement | { error: ReturnType<typeof apiError> }> {
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

  return validateAchievementInput(userId, goal ?? undefined, data);
}

function validateAchievementInput(
  userId: string,
  goal: GoalWithSheet | undefined,
  data: AchievementInput
): PreparedAchievement | { error: ReturnType<typeof apiError> } {
  if (!goal) return { error: apiError("Goal not found", 404) };

  if (goal.goalSheet.employeeId !== userId) {
    return { error: apiError("Forbidden", 403) };
  }

  if (!goal.goalSheet.isLocked || goal.goalSheet.status !== "APPROVED") {
    return {
      error: apiError(
        "Achievements can only be logged after goals are approved and locked",
        403
      ),
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

  return { goal, data, progress };
}

async function commitAchievementUpsert(
  tx: AchievementDb,
  userId: string,
  { goal, data, progress }: PreparedAchievement
) {
  const achievement = await tx.achievement.upsert({
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
    goal,
    data.quarter,
    {
      cycleId: data.cycleId,
      actualValue: data.actualValue,
      completionDate: data.completionDate,
      status: data.status,
      progressScore: progress.score,
      remark: data.remark,
    },
    goal.goalSheet.employee.name,
    tx
  );

  await writeAuditLog(
    {
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
    },
    tx
  );

  return {
    ...achievement,
    progress,
  };
}
