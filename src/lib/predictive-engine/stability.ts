import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { HistoricalSeries } from "./historical";
import type { StabilityMetrics } from "./types";
import { velocityScore, clamp } from "./utils";

export function computeStability(
  snapshot: IntelligenceSnapshot,
  history: HistoricalSeries
): StabilityMetrics {
  const kpis = kpiMap(snapshot);
  const healthVol = Math.abs(velocityScore(history.health));
  const completionVol = Math.abs(velocityScore(history.completion));

  const engagementConsistency = clamp(100 - healthVol * 4);
  const participationReliability = clamp(kpis.checkinCompliance ?? 60);
  const managerResponsiveness = clamp(100 - (kpis.delayedApprovals ?? 0) * 4);
  const operationalResilience = clamp(
    100 - (kpis.activeEscalations ?? 0) * 2 - snapshot.escalations.unresolvedCount
  );
  const executionVolatility = clamp(100 - completionVol * 5 - healthVol * 3);

  const overall = Math.round(
    engagementConsistency * 0.2 +
      participationReliability * 0.25 +
      managerResponsiveness * 0.25 +
      operationalResilience * 0.2 +
      executionVolatility * 0.1
  );

  let narrative = `Workforce stability at ${overall}% with ${executionVolatility > 70 ? "low" : "elevated"} execution volatility.`;
  if (managerResponsiveness < 60) {
    narrative += " Manager responsiveness requires proactive leadership attention.";
  } else if (overall >= 75) {
    narrative += " Organization demonstrates resilient operational patterns.";
  }

  return {
    overall,
    engagementConsistency,
    participationReliability,
    managerResponsiveness,
    operationalResilience,
    executionVolatility,
    narrative,
  };
}
