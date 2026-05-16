import { prisma } from "@/lib/prisma";
import type { CheckinStatus } from "@prisma/client";

export interface AchievementSyncData {
  cycleId: string;
  actualValue?: number | null;
  completionDate?: Date | null;
  status: CheckinStatus;
  progressScore: number;
  remark?: string | null;
}

/** Primary owner = earliest-created linked goal's employee (first assignee). */
export async function isPrimarySharedGoalOwner(goalId: string): Promise<boolean> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      goalSheet: { select: { employeeId: true } },
      sharedGoal: {
        include: {
          goals: {
            include: { goalSheet: { select: { employeeId: true, createdAt: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!goal?.isShared || !goal.sharedGoal) return true;

  const primary = goal.sharedGoal.goals[0]?.goalSheet.employeeId;
  return goal.goalSheet.employeeId === primary;
}

export async function syncSharedGoalAchievement(
  goalId: string,
  quarter: string,
  data: AchievementSyncData,
  sourceEmployeeName: string
) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { isShared: true, sharedGoalId: true },
  });

  if (!goal?.isShared || !goal.sharedGoalId) return;

  const isPrimary = await isPrimarySharedGoalOwner(goalId);
  if (!isPrimary) return;

  const linkedGoals = await prisma.goal.findMany({
    where: {
      sharedGoalId: goal.sharedGoalId,
      id: { not: goalId },
    },
    select: { id: true },
  });

  for (const linked of linkedGoals) {
    const remarkPrefix = `[Synced from ${sourceEmployeeName}]`;
    const remark = data.remark
      ? `${remarkPrefix} ${data.remark}`
      : remarkPrefix;

    await prisma.achievement.upsert({
      where: { goalId_quarter: { goalId: linked.id, quarter } },
      update: {
        actualValue: data.actualValue,
        completionDate: data.completionDate,
        status: data.status,
        progressScore: data.progressScore,
        remark,
      },
      create: {
        goalId: linked.id,
        quarter,
        cycleId: data.cycleId,
        actualValue: data.actualValue,
        completionDate: data.completionDate,
        status: data.status,
        progressScore: data.progressScore,
        remark,
      },
    });
  }
}
