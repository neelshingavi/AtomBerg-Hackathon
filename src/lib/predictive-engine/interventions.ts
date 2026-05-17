import type { PredictedRisk, PredictedBottleneck, EarlyWarning, InterventionRecommendation } from "./types";

export function buildInterventions(params: {
  predictions: PredictedRisk[];
  bottlenecks: PredictedBottleneck[];
  warnings: EarlyWarning[];
}): InterventionRecommendation[] {
  const items: InterventionRecommendation[] = [];

  const approvalBn = params.bottlenecks.find((b) => b.type === "approval");
  if (approvalBn) {
    items.push({
      id: "int-approval",
      title: "Redistribute approvals across managers",
      description:
        "Balance pending approval queues to prevent cycle-end congestion. Consider skip-level review for aged submissions.",
      priority: approvalBn.severity,
      confidence: approvalBn.confidence,
      expectedImpact: "15–25% reduction in approval latency",
      targetDepartments: [],
      actionType: "approval",
    });
  }

  const checkinPred = params.predictions.find((p) => p.category === "missed_checkin");
  if (checkinPred) {
    items.push({
      id: "int-checkin",
      title: "Increase check-in cadence for at-risk teams",
      description: `Proactive check-in cadence for ${checkinPred.affectedDepartments.join(", ") || "affected teams"} before quarterly close.`,
      priority: checkinPred.severity,
      confidence: checkinPred.confidence,
      expectedImpact: "Improved execution visibility",
      targetDepartments: checkinPred.affectedDepartments,
      actionType: "checkin",
    });
  }

  const escWarn = params.warnings.find((w) => w.id.includes("esc"));
  if (escWarn) {
    items.push({
      id: "int-escalation",
      title: escWarn.department
        ? `Investigate ${escWarn.department} escalation surge`
        : "Investigate escalation surge",
      description: "Root-cause analysis on escalation triggers and manager SLA adherence.",
      priority: "high",
      confidence: escWarn.confidence,
      expectedImpact: "Stabilize escalation trajectory",
      targetDepartments: escWarn.department ? [escWarn.department] : [],
      actionType: "escalation",
    });
  }

  const mgrBn = params.bottlenecks.filter((b) => b.type === "manager").slice(0, 2);
  for (const bn of mgrBn) {
    items.push({
      id: `int-mgr-${bn.id}`,
      title: `Manager capacity review: ${bn.managerName}`,
      description: bn.description,
      priority: bn.severity,
      confidence: bn.confidence,
      expectedImpact: "Reduced team execution friction",
      targetDepartments: bn.department ? [bn.department] : [],
      actionType: "manager",
    });
  }

  const strat = params.predictions.find((p) => p.category === "strategic_risk");
  if (strat) {
    items.push({
      id: "int-strategic",
      title: "Review cross-functional dependency blockers",
      description:
        "Executive review of strategic initiative dependencies and shared goal adoption gaps.",
      priority: strat.severity,
      confidence: strat.confidence,
      expectedImpact: "Protect strategic OKR attainment",
      targetDepartments: strat.affectedDepartments,
      actionType: "strategic",
    });
  }

  const depBn = params.bottlenecks.find((b) => b.type === "dependency");
  if (depBn) {
    items.push({
      id: "int-dependency",
      title: "Resolve critical dependency chains",
      description: depBn.description,
      priority: depBn.severity,
      confidence: depBn.confidence,
      expectedImpact: "Unblock downstream execution",
      targetDepartments: depBn.department ? [depBn.department] : [],
      actionType: "dependency",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "int-maintain",
      title: "Maintain current execution cadence",
      description: "Predictive models show stable trajectory — continue monitoring key metrics.",
      priority: "low",
      confidence: 75,
      expectedImpact: "Sustained organizational health",
      targetDepartments: [],
      actionType: "strategic",
    });
  }

  return items.slice(0, 8);
}
