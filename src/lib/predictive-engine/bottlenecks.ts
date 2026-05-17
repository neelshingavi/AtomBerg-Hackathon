import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { PredictedBottleneck } from "./types";
import { probabilityFromSignals, severityFromProbability } from "./utils";

export function predictBottlenecks(snapshot: IntelligenceSnapshot): PredictedBottleneck[] {
  const kpis = kpiMap(snapshot);
  const items: PredictedBottleneck[] = [];

  for (const mgr of snapshot.managerRisks.slice(0, 8)) {
    const prob = probabilityFromSignals([
      { weight: 40, active: mgr.score >= 50 },
      { weight: 30, active: mgr.factors.some((f) => f.factor === "delayed_manager") },
      { weight: 30, active: (mgr.escalationCount ?? 0) >= 2 },
    ]);
    if (prob >= 45) {
      items.push({
        id: `bn-mgr-${mgr.id}`,
        type: "manager",
        title: `Predicted overload: ${mgr.name}`,
        description: `${prob}% probability of approval congestion within 2–3 weeks`,
        probability: prob,
        confidence: 81,
        severity: severityFromProbability(prob),
        department: mgr.department,
        managerName: mgr.name,
        daysUntilImpact: 14,
      });
    }
  }

  if ((kpis.delayedApprovals ?? 0) >= 3) {
    const prob = Math.min(95, 50 + (kpis.delayedApprovals ?? 0) * 5);
    items.push({
      id: "bn-approval-pipeline",
      type: "approval",
      title: "Approval pipeline congestion",
      description: `${kpis.delayedApprovals} delayed approvals forecast to create cycle-end bottleneck`,
      probability: prob,
      confidence: 86,
      severity: severityFromProbability(prob),
      daysUntilImpact: 10,
    });
  }

  const escHot = [...snapshot.escalations.byDepartment]
    .filter((d) => d.unresolved >= 2)
    .sort((a, b) => b.unresolved - a.unresolved)[0];
  if (escHot) {
    items.push({
      id: `bn-esc-${escHot.department}`,
      type: "escalation",
      title: `Escalation hotspot: ${escHot.department}`,
      description: `${escHot.unresolved} unresolved escalations — predicted operational choke point`,
      probability: Math.min(90, 40 + escHot.unresolved * 12),
      confidence: 84,
      severity: "high",
      department: escHot.department,
      daysUntilImpact: 7,
    });
  }

  const isolated = snapshot.executive.departmentHealth.filter(
    (d) => d.healthStatus === "critical" || d.completionPct < 40
  );
  for (const d of isolated.slice(0, 2)) {
    items.push({
      id: `bn-team-${d.departmentId}`,
      type: "team",
      title: `Isolated team friction: ${d.department}`,
      description: "Low collaboration signals and declining execution quality",
      probability: Math.min(88, 100 - d.completionPct),
      confidence: 77,
      severity: d.healthStatus === "critical" ? "critical" : "high",
      department: d.department,
      daysUntilImpact: 21,
    });
  }

  if ((kpis.orgGoalCompletion ?? 0) < 50) {
    items.push({
      id: "bn-cycle",
      type: "cycle",
      title: "Cycle completion delay risk",
      description: "Projected cycle completion below enterprise threshold",
      probability: Math.min(92, 110 - (kpis.orgGoalCompletion ?? 0)),
      confidence: 79,
      severity: "high",
      daysUntilImpact: 30,
    });
  }

  return items.sort((a, b) => b.probability - a.probability).slice(0, 10);
}
