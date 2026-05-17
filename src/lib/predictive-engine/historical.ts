import { prisma } from "@/lib/prisma";
import { subWeeks, format } from "date-fns";

export type HistoricalSeries = {
  health: number[];
  completion: number[];
  escalations: number[];
  approvals: number[];
  labels: string[];
};

export async function buildHistoricalSeries(cycleId: string): Promise<HistoricalSeries> {
  const now = new Date();
  const health: number[] = [];
  const completion: number[] = [];
  const escalations: number[] = [];
  const approvals: number[] = [];
  const labels: string[] = [];

  for (let w = 8; w >= 0; w--) {
    const at = subWeeks(now, w);
    const since = subWeeks(at, 1);

    const [escCount, atRisk, approved, totalSheets, achievements] = await Promise.all([
      prisma.escalationLog.count({ where: { createdAt: { gte: since, lte: at } } }),
      prisma.achievement.count({
        where: { cycleId, status: "AT_RISK", updatedAt: { lte: at } },
      }),
      prisma.goalSheet.count({
        where: { cycleId, status: "APPROVED", approvedAt: { lte: at } },
      }),
      prisma.goalSheet.count({ where: { cycleId, createdAt: { lte: at } } }),
      prisma.achievement.count({
        where: {
          cycleId,
          actualValue: { not: null },
          updatedAt: { gte: since, lte: at },
        },
      }),
    ]);

    const completionPct =
      totalSheets > 0 ? Math.round((approved / totalSheets) * 100) : 0;
    const healthScore = clampScore(85 - escCount * 3 - atRisk * 2 + Math.min(achievements, 8));
    const approvalVelocity = clampScore(100 - escCount * 4);

    health.push(healthScore);
    completion.push(completionPct);
    escalations.push(escCount);
    approvals.push(approvalVelocity);
    labels.push(w === 0 ? "Now" : format(at, "MMM d"));
  }

  return { health, completion, escalations, approvals, labels };
}

function clampScore(n: number): number {
  return Math.max(15, Math.min(98, Math.round(n)));
}
