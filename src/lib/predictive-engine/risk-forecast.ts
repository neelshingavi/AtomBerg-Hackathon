import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { HistoricalSeries } from "./historical";
import type { PredictedRisk, ForecastHorizon } from "./types";
import {
  probabilityFromSignals,
  severityFromProbability,
  velocityScore,
  formatHorizon,
} from "./utils";

export function buildRiskPredictions(
  snapshot: IntelligenceSnapshot,
  history: HistoricalSeries,
  horizon: ForecastHorizon
): PredictedRisk[] {
  const kpis = kpiMap(snapshot);
  const predictions: PredictedRisk[] = [];
  const horizonLabel = formatHorizon(horizon);

  const escVelocity = velocityScore(history.escalations);
  const completionVelocity = velocityScore(history.completion);
  const approvalVelocity = velocityScore(history.approvals);

  for (const dept of snapshot.executive.departmentHealth) {
    const approvalProb = probabilityFromSignals([
      { weight: 30, active: dept.delayedApprovals >= 2 },
      { weight: 25, active: dept.completionPct < 50 },
      { weight: 20, active: approvalVelocity < -5 },
      { weight: 15, active: (kpis.delayedApprovals ?? 0) > 5 },
      { weight: 10, active: dept.healthStatus === "critical" },
    ]);

    if (approvalProb >= 40) {
      predictions.push({
        id: `pred-approval-${dept.departmentId}`,
        category: "approval_bottleneck",
        title: `${dept.department} approval bottleneck risk`,
        narrative: `${dept.department} has ${approvalProb}% probability of approval bottlenecks in the ${horizonLabel}. ${dept.delayedApprovals} delayed approvals currently impacting velocity.`,
        probability: approvalProb,
        confidence: clampConfidence(78 + (dept.delayedApprovals > 0 ? 8 : 0)),
        severity: severityFromProbability(approvalProb),
        projectedImpact: `Cycle completion may slip 8–15% in ${dept.department}`,
        horizon,
        affectedDepartments: [dept.department],
        affectedManagers: [],
        factors: [
          { factor: "Delayed approvals", weight: dept.delayedApprovals, direction: "up" },
          { factor: "Completion trend", weight: dept.completionPct, direction: completionVelocity < 0 ? "down" : "up" },
        ],
      });
    }

    const checkinProb = probabilityFromSignals([
      { weight: 35, active: dept.delayedCheckins >= 2 },
      { weight: 25, active: dept.riskScore >= 50 },
      { weight: 20, active: completionVelocity < 0 },
      { weight: 20, active: dept.healthStatus !== "healthy" },
    ]);

    if (checkinProb >= 45) {
      predictions.push({
        id: `pred-checkin-${dept.departmentId}`,
        category: "missed_checkin",
        title: `${dept.department} check-in miss risk`,
        narrative: `${dept.delayedCheckins} at-risk check-ins signal ${checkinProb}% likelihood of missed quarterly check-ins in the ${horizonLabel}.`,
        probability: checkinProb,
        confidence: 82,
        severity: severityFromProbability(checkinProb),
        projectedImpact: "Execution visibility degradation",
        horizon,
        affectedDepartments: [dept.department],
        affectedManagers: [],
        factors: [{ factor: "At-risk check-ins", weight: dept.delayedCheckins, direction: "up" }],
      });
    }
  }

  if (escVelocity > 2 || (kpis.activeEscalations ?? 0) > 8) {
    const escProb = probabilityFromSignals([
      { weight: 40, active: escVelocity > 3 },
      { weight: 30, active: (kpis.activeEscalations ?? 0) > 10 },
      { weight: 20, active: snapshot.escalations.unresolvedCount > 15 },
      { weight: 10, active: snapshot.escalations.managerSlaCompliance < 70 },
    ]);
    const topDept = [...snapshot.escalations.byDepartment].sort(
      (a, b) => b.unresolved - a.unresolved
    )[0];
    predictions.push({
      id: "pred-escalation-spike",
      category: "escalation_spike",
      title: "Escalation volume spike forecast",
      narrative: `Escalation growth trend (+${escVelocity}/week) indicates ${escProb}% probability of escalation spike in the ${horizonLabel}.${topDept ? ` ${topDept.department} shows highest density.` : ""}`,
      probability: escProb,
      confidence: 85,
      severity: severityFromProbability(escProb),
      projectedImpact: "Leadership intervention load increase",
      horizon,
      affectedDepartments: topDept ? [topDept.department] : [],
      affectedManagers: [],
      factors: [{ factor: "Escalation velocity", weight: escVelocity, direction: "up" }],
    });
  }

  for (const mgr of snapshot.managerRisks.slice(0, 6)) {
    const overloadProb = probabilityFromSignals([
      { weight: 35, active: mgr.score >= 55 },
      { weight: 30, active: mgr.factors.some((f) => f.factor === "delayed_manager") },
      { weight: 20, active: mgr.factors.some((f) => f.factor === "repeated_escalation") },
      { weight: 15, active: (mgr.escalationCount ?? 0) >= 2 },
    ]);
    if (overloadProb >= 50) {
      predictions.push({
        id: `pred-mgr-${mgr.id}`,
        category: "manager_overload",
        title: `${mgr.name} overload risk`,
        narrative: `Operations manager overload increasing — ${overloadProb}% escalation likelihood for ${mgr.name}'s team in the ${horizonLabel}.`,
        probability: overloadProb,
        confidence: 80,
        severity: severityFromProbability(overloadProb),
        projectedImpact: "Team execution friction and approval delays",
        horizon,
        affectedDepartments: mgr.department ? [mgr.department] : [],
        affectedManagers: [mgr.name],
        factors: mgr.factors.slice(0, 3).map((f) => ({
          factor: f.label,
          weight: f.weight,
          direction: "up" as const,
        })),
      });
    }
  }

  const strategicProb = probabilityFromSignals([
    { weight: 30, active: (kpis.sharedGoalAdoption ?? 0) < 45 },
    { weight: 25, active: completionVelocity < -3 },
    { weight: 25, active: (kpis.orgGoalCompletion ?? 0) < 55 },
    { weight: 20, active: snapshot.employeeRisks.filter((e) => e.level === "critical").length > 3 },
  ]);

  if (strategicProb >= 45) {
    const eng = snapshot.executive.departmentHealth.find((d) =>
      /engineer/i.test(d.department)
    );
    predictions.push({
      id: "pred-strategic",
      category: "strategic_risk",
      title: eng
        ? `${eng.department} strategic execution risk`
        : "Strategic initiative execution risk",
      narrative: eng
        ? `${eng.department} likely to miss upcoming strategic execution targets (${strategicProb}% probability) based on completion velocity and shared goal adoption.`
        : `${strategicProb}% probability of strategic initiative underperformance in the ${horizonLabel}.`,
      probability: strategicProb,
      confidence: 76,
      severity: severityFromProbability(strategicProb),
      projectedImpact: "Company OKR attainment at risk",
      horizon,
      affectedDepartments: eng ? [eng.department] : [],
      affectedManagers: [],
      factors: [
        { factor: "Shared goal adoption", weight: kpis.sharedGoalAdoption ?? 0, direction: "down" },
        { factor: "Completion velocity", weight: completionVelocity, direction: completionVelocity < 0 ? "down" : "up" },
      ],
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability).slice(0, 12);
}

function clampConfidence(n: number): number {
  return Math.max(55, Math.min(96, n));
}
