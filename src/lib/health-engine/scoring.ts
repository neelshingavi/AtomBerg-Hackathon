import type { HealthState } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";

export function scoreToState(score: number): HealthState {
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 60) return "watchlist";
  if (score >= 45) return "at_risk";
  return "critical";
}

export const STATE_LABELS: Record<HealthState, string> = {
  excellent: "Excellent",
  healthy: "Healthy",
  watchlist: "Watchlist",
  at_risk: "At Risk",
  critical: "Critical",
};

export function computeWeightedHealth(snapshot: IntelligenceSnapshot) {
  const kpis = kpiMap(snapshot);
  const completion = kpis.orgGoalCompletion ?? 0;
  const checkins = kpis.checkinCompliance ?? 0;
  const delayedApprovals = kpis.delayedApprovals ?? 0;
  const activeEscalations = kpis.activeEscalations ?? 0;
  const atRisk = kpis.atRiskEmployees ?? 0;
  const sharedGoals = kpis.sharedGoalAdoption ?? 0;
  const managerReview = kpis.managerReviewCompletion ?? 0;

  const approvalScore = Math.max(0, 100 - delayedApprovals * 4);
  const escalationScore = Math.max(0, 100 - activeEscalations * 3);
  const riskScore = Math.max(0, 100 - atRisk * 5);
  const participation = Math.min(
    100,
    Math.round((snapshot.executive.departmentHealth.length / 4) * 100)
  );

  const factors = [
    { key: "completion", label: "Goal Completion", score: completion, weight: 0.22, trend: "stable" as const },
    { key: "checkins", label: "Check-in Compliance", score: checkins, weight: 0.15, trend: "stable" as const },
    { key: "approvals", label: "Approval Velocity", score: approvalScore, weight: 0.15, trend: delayedApprovals > 5 ? "down" as const : "up" as const },
    { key: "escalations", label: "Escalation Control", score: escalationScore, weight: 0.14, trend: activeEscalations > 10 ? "down" as const : "stable" as const },
    { key: "risk", label: "Workforce Risk", score: riskScore, weight: 0.12, trend: atRisk > 8 ? "down" as const : "stable" as const },
    { key: "managers", label: "Manager Effectiveness", score: managerReview, weight: 0.1, trend: "stable" as const },
    { key: "alignment", label: "Strategic Alignment", score: sharedGoals, weight: 0.07, trend: "stable" as const },
    { key: "participation", label: "Org Participation", score: participation, weight: 0.05, trend: "stable" as const },
  ];

  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  const previousScore = Math.max(0, Math.min(100, overallScore - Math.floor(Math.random() * 8) + 2));
  const trendPct = overallScore - previousScore;

  return { overallScore, factors, previousScore, trendPct };
}

export function buildHealthNarrative(
  snapshot: IntelligenceSnapshot,
  score: number,
  state: HealthState
): string {
  const worstDept = [...snapshot.executive.departmentHealth].sort(
    (a, b) => a.completionPct - b.completionPct
  )[0];
  const kpis = kpiMap(snapshot);

  if (state === "excellent" || state === "healthy") {
    return `Organization pulse is ${STATE_LABELS[state].toLowerCase()} at ${score}%. Goal completion stands at ${kpis.orgGoalCompletion ?? 0}% with strong execution momentum across departments.`;
  }

  const reasons: string[] = [];
  if ((kpis.delayedApprovals ?? 0) > 5) {
    reasons.push("increased approval latency");
  }
  if ((kpis.activeEscalations ?? 0) > 8) {
    reasons.push("rising escalation volume");
  }
  if ((kpis.atRiskEmployees ?? 0) > 5) {
    reasons.push("elevated at-risk check-ins");
  }
  if (worstDept && worstDept.completionPct < 50) {
    reasons.push(`${worstDept.department} trailing on completion`);
  }

  const reasonText =
    reasons.length > 0 ? reasons.join(", ") : "mixed operational signals";

  return `Organization health is ${STATE_LABELS[state].toLowerCase()} (${score}%) primarily due to ${reasonText}. Leadership intervention recommended in high-impact areas.`;
}
