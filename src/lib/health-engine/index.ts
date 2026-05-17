import type { OrganizationPulse } from "@/lib/intelligence/types";
import { buildIntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { getCached, setCache } from "@/lib/intelligence/cache";
import {
  buildHealthNarrative,
  computeWeightedHealth,
  scoreToState,
  STATE_LABELS,
} from "./scoring";

export async function computeOrganizationPulse(
  cycleId: string
): Promise<OrganizationPulse> {
  const cacheKey = `intel:pulse:${cycleId}`;
  const cached = getCached<OrganizationPulse>(cacheKey);
  if (cached) return cached;

  const snapshot = await buildIntelligenceSnapshot(cycleId);
  const { overallScore, factors, previousScore, trendPct } =
    computeWeightedHealth(snapshot);
  const state = scoreToState(overallScore);

  const departments = snapshot.executive.departmentHealth.map((d) => {
    const deptScore = Math.round(
      d.completionPct * 0.4 +
        (100 - d.riskScore) * 0.3 +
        d.managerResponsiveness * 0.2 +
        Math.max(0, 100 - d.escalationCount * 5) * 0.1
    );
    const deptState = scoreToState(deptScore);
    let narrative = `${d.department} is ${STATE_LABELS[deptState].toLowerCase()} at ${deptScore}% completion.`;
    if (d.delayedApprovals > 0) {
      narrative += ` ${d.delayedApprovals} delayed approvals impacting velocity.`;
    }
    if (d.delayedCheckins > 0) {
      narrative += ` ${d.delayedCheckins} at-risk check-ins require attention.`;
    }
    return {
      id: d.departmentId,
      name: d.department,
      score: deptScore,
      state: deptState,
      trendPct: d.trendPct,
      narrative,
    };
  });

  const managers = snapshot.managerRisks.slice(0, 8).map((m) => ({
    id: m.id,
    name: m.name,
    score: Math.max(0, 100 - m.score),
    state: scoreToState(Math.max(0, 100 - m.score)),
    department: m.department,
  }));

  const cycleScore = Math.round(
    (overallScore + departments.reduce((s, d) => s + d.score, 0) / Math.max(departments.length, 1)) / 2
  );

  const pulse: OrganizationPulse = {
    overallScore,
    state,
    stateLabel: STATE_LABELS[state],
    confidence: Math.min(98, 72 + Math.min(snapshot.employeeCount, 30)),
    trendPct,
    previousScore,
    narrative: buildHealthNarrative(snapshot, overallScore, state),
    factors,
    departments,
    managers,
    cycleScore,
    sparkline: factors.map((f) => f.score),
  };

  setCache(cacheKey, pulse, 45_000);
  return pulse;
}

export { scoreToState, STATE_LABELS } from "./scoring";
