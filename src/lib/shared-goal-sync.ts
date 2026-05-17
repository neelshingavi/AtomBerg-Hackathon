import { prisma } from "@/lib/prisma";
import type { CheckinStatus } from "@prisma/client";

type SyncDb = Pick<typeof prisma, "goal" | "achievement">;

export interface AchievementSyncData {
  cycleId: string;
  actualValue?: number | null;
  completionDate?: Date | null;
  status: CheckinStatus;
  progressScore: number;
  remark?: string | null;
}

export type SyncableGoal = {
  id: string;
  isShared: boolean;
  sharedGoalId: string | null;
};

/** Primary owner = earliest-created linked goal (first assignee). */
export async function isPrimarySharedGoalOwner(goalId: string): Promise<boolean> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { id: true, isShared: true, sharedGoalId: true },
  });

  if (!goal?.isShared || !goal.sharedGoalId) return true;

  const linkedGoals = await prisma.goal.findMany({
    where: { sharedGoalId: goal.sharedGoalId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return linkedGoals[0]?.id === goal.id;
}

export async function syncSharedGoalAchievement(
  goal: SyncableGoal,
  quarter: string,
  data: AchievementSyncData,
  sourceEmployeeName: string,
  db: SyncDb = prisma
) {
  if (!goal.isShared || !goal.sharedGoalId) return;

  const linkedGoals = await db.goal.findMany({
    where: { sharedGoalId: goal.sharedGoalId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (linkedGoals[0]?.id !== goal.id) return;

  const linkedGoalIds = linkedGoals
    .filter((g) => g.id !== goal.id)
    .map((g) => g.id);

  if (linkedGoalIds.length === 0) return;

  const remarkPrefix = `[Synced from ${sourceEmployeeName}]`;
  const remark = data.remark ? `${remarkPrefix} ${data.remark}` : remarkPrefix;

  await Promise.all(
    linkedGoalIds.map((linkedGoalId) =>
      db.achievement.upsert({
        where: { goalId_quarter: { goalId: linkedGoalId, quarter } },
        update: {
          actualValue: data.actualValue,
          completionDate: data.completionDate,
          status: data.status,
          progressScore: data.progressScore,
          remark,
        },
        create: {
          goalId: linkedGoalId,
          quarter,
          cycleId: data.cycleId,
          actualValue: data.actualValue,
          completionDate: data.completionDate,
          status: data.status,
          progressScore: data.progressScore,
          remark,
        },
      })
    )
  );
}
