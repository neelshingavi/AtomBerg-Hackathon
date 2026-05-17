import type { ExecutiveBriefing } from "@/lib/intelligence/types";
import { computeOrganizationPulse } from "@/lib/health-engine";
import { generateLeadershipRecommendations } from "@/lib/recommendations/engine";
import { detectAnomalies } from "@/lib/anomaly-detection/detector";
import { buildWhatChanged } from "./what-changed";
import { kpiMap } from "@/lib/intelligence/snapshot";

export async function generateExecutiveBriefing(
  cycleId: string,
  type: ExecutiveBriefing["type"] = "organization"
): Promise<ExecutiveBriefing> {
  const { buildIntelligenceSnapshot } = await import("@/lib/intelligence/snapshot");
  const snapshot = await buildIntelligenceSnapshot(cycleId);
  const pulse = await computeOrganizationPulse(cycleId);
  const recs = generateLeadershipRecommendations(snapshot);
  const anomalies = detectAnomalies(snapshot);
  const changes = buildWhatChanged(snapshot);
  const kpis = kpiMap(snapshot);

  const developments = [
    `Organization pulse: ${pulse.stateLabel} (${pulse.overallScore}/100)`,
    changes.executiveSummary,
    `Check-in compliance at ${kpis.checkinCompliance ?? 0}%`,
    `${snapshot.escalations.unresolvedCount} open escalations across the org`,
  ];

  const risks = [
    ...anomalies.slice(0, 3).map((a) => a.description),
    ...snapshot.employeeRisks
      .filter((e) => e.level === "critical")
      .slice(0, 2)
      .map((e) => `${e.name} in critical risk band (${e.score})`),
  ].filter(Boolean);

  return {
    id: `briefing-${cycleId}-${Date.now()}`,
    type,
    title:
      type === "organization"
        ? "Organization Leadership Briefing"
        : type === "escalation"
          ? "Escalation Intelligence Briefing"
          : "Workforce Risk Briefing",
    generatedAt: new Date().toISOString(),
    summary: pulse.narrative,
    developments,
    risks,
    recommendations: recs.slice(0, 4).map((r) => r.title),
    nextActions: recs.slice(0, 3).map((r) => r.actionLabel),
  };
}
