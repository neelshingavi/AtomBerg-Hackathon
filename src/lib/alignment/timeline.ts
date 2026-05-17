import { prisma } from "@/lib/prisma";
import type { TimelineFrame } from "./types";
import { subWeeks, format } from "date-fns";

export async function buildAlignmentTimeline(cycleId: string): Promise<TimelineFrame[]> {
  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return [];

  const now = new Date();
  const frames: TimelineFrame[] = [];

  for (let w = 8; w >= 0; w--) {
    const at = subWeeks(now, w);
    const since = subWeeks(at, 1);

    const [escalations, atRiskAchievements, auditCount] = await Promise.all([
      prisma.escalationLog.count({
        where: { createdAt: { gte: since, lte: at } },
      }),
      prisma.achievement.count({
        where: {
          cycleId,
          status: "AT_RISK",
          updatedAt: { lte: at },
        },
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: since, lte: at } },
      }),
    ]);

    const healthScore = Math.max(
      20,
      Math.min(95, 85 - escalations * 3 - atRiskAchievements * 2 + Math.min(auditCount, 10))
    );
    const alignmentScore = Math.max(30, healthScore - escalations * 2);

    frames.push({
      timestamp: at.toISOString(),
      label: w === 0 ? "Now" : format(at, "MMM d"),
      healthScore,
      atRiskCount: atRiskAchievements,
      escalationCount: escalations,
      alignmentScore,
      affectedNodeIds: [],
    });
  }

  return frames;
}
