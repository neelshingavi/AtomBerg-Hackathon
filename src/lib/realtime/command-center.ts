import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import { computeOrganizationPulse } from "@/lib/health-engine";
import { buildPredictiveSnapshot } from "@/lib/predictive-engine";
import { fetchLiveActivityStream } from "./activity-stream";
import { listActiveAlerts, synthesizeLiveAlerts } from "./alerts";
import { generateCollaborationInsights } from "./collaboration-insights";
import { listOnlineUsers } from "./presence";
import type { CommandCenterLive } from "./types";

export async function buildCommandCenterLive(): Promise<CommandCenterLive> {
  const cycle = await getActiveCycle();
  const cycleId = cycle?.id;

  if (cycleId) {
    await synthesizeLiveAlerts(cycleId).catch(() => undefined);
  }

  const [pulse, predictive, pendingApprovals, alerts, recentEvents, presence] =
    await Promise.all([
      cycleId ? computeOrganizationPulse(cycleId) : null,
      cycleId ? buildPredictiveSnapshot(cycleId, "quarter").catch(() => null) : null,
      prisma.goalSheet.count({ where: { status: "SUBMITTED" } }),
      listActiveAlerts(12),
      fetchLiveActivityStream({ limit: 15 }),
      listOnlineUsers(16),
    ]);

  const submitted = await prisma.goalSheet.findMany({
    where: { status: "SUBMITTED", submittedAt: { not: null } },
    select: { submittedAt: true },
    take: 50,
  });

  let avgHours = 0;
  if (submitted.length) {
    const hours = submitted.map(
      (s) => (Date.now() - (s.submittedAt?.getTime() ?? Date.now())) / 3_600_000
    );
    avgHours = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
  }

  const managerLoads = await prisma.goalSheet.groupBy({
    by: ["managerId"],
    where: { status: "SUBMITTED", managerId: { not: null } },
    _count: { id: true },
  });
  const bottleneckCount = managerLoads.filter((m) => m._count.id >= 4).length;

  const initiatives =
    predictive?.initiatives.slice(0, 6).map((i) => ({
      id: i.id,
      title: i.title,
      momentum: i.successProbability >= 60 ? "On track" : "At risk",
      blockers: i.riskContributors.length,
    })) ?? [];

  const activeEscalations = await prisma.escalationLog.count({
    where: { status: { not: "RESOLVED" } },
  });

  return {
    pulse: {
      overallScore: pulse?.overallScore ?? 72,
      trend:
        (pulse?.trendPct ?? 0) > 2
          ? "improving"
          : (pulse?.trendPct ?? 0) < -2
            ? "declining"
            : "stable",
      escalations: activeEscalations,
      pendingApprovals,
      alignmentScore: pulse?.cycleScore ?? pulse?.overallScore ?? 0,
      momentum: predictive?.momentum.overall ?? pulse?.overallScore ?? 70,
    },
    alerts,
    recentEvents,
    presence,
    approvalVelocity: { avgHours, bottleneckCount },
    collaborationInsights: await generateCollaborationInsights(cycleId),
    initiatives,
  };
}
