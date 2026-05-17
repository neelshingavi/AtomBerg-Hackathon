import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { HistoricalSeries } from "./historical";
import type { MomentumScore } from "./types";
import { velocityScore, clamp } from "./utils";

export function computeMomentum(
  snapshot: IntelligenceSnapshot,
  history: HistoricalSeries
): MomentumScore {
  const kpis = kpiMap(snapshot);
  const completionVel = velocityScore(history.completion);
  const healthVel = velocityScore(history.health);
  const escVel = velocityScore(history.escalations);

  const completionAccel = clamp(50 + completionVel * 3);
  const participationGrowth = clamp((kpis.checkinCompliance ?? 0) * 0.6 + completionAccel * 0.4);
  const responsiveness = clamp(100 - (kpis.delayedApprovals ?? 0) * 3);
  const collaboration = clamp(kpis.sharedGoalAdoption ?? 50);
  const riskReduction = clamp(100 - escVel * 8 - (kpis.atRiskEmployees ?? 0) * 4);
  const consistency = clamp(70 + healthVel * 2);

  const overall = Math.round(
    completionAccel * 0.25 +
      participationGrowth * 0.2 +
      responsiveness * 0.2 +
      collaboration * 0.15 +
      riskReduction * 0.12 +
      consistency * 0.08
  );

  const acceleration = Math.round((completionVel + healthVel - escVel) * 10) / 10;
  const trend =
    acceleration > 3 ? "accelerating" : acceleration < -3 ? "decelerating" : "stable";

  const departments = snapshot.executive.departmentHealth.map((d) => ({
    id: d.departmentId,
    name: d.department,
    score: clamp(d.completionPct + d.trendPct * 0.5),
    trend: d.trendPct > 2 ? "accelerating" : d.trendPct < -2 ? "decelerating" : "stable",
  }));

  const initiatives = snapshot.executive.departmentHealth.slice(0, 4).map((d) => ({
    id: `init-${d.departmentId}`,
    label: `${d.department} execution`,
    score: clamp(d.completionPct - d.riskScore * 0.2),
  }));

  return { overall, acceleration, trend, departments, initiatives };
}
