import type { LeadershipRecommendation } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";

export function generateLeadershipRecommendations(
  snapshot: IntelligenceSnapshot
): LeadershipRecommendation[] {
  const kpis = kpiMap(snapshot);
  const recs: LeadershipRecommendation[] = [];

  const worstDept = [...snapshot.executive.departmentHealth].sort(
    (a, b) => a.completionPct - b.completionPct
  )[0];
  if (worstDept && worstDept.completionPct < 55) {
    recs.push({
      id: "rec-dept-support",
      title: `Support ${worstDept.department} execution recovery`,
      description: `${worstDept.department} trails at ${worstDept.completionPct}% with ${worstDept.delayedCheckins} delayed check-ins.`,
      urgency: worstDept.healthStatus === "critical" ? "critical" : "high",
      confidence: 92,
      impact: "high",
      affectedCount: worstDept.delayedCheckins,
      departments: [worstDept.department],
      actionLabel: "View department health",
      href: `/admin/executive#department-health`,
      factors: ["Low completion %", "Delayed check-ins", "Department risk score"],
    });
  }

  const escDept = [...snapshot.escalations.byDepartment].sort(
    (a, b) => b.unresolved - a.unresolved
  )[0];
  if (escDept && escDept.unresolved > 0) {
    recs.push({
      id: "rec-esc-backlog",
      title: `Review ${escDept.department} escalation backlog`,
      description: `${escDept.unresolved} unresolved escalations — highest density in the organization.`,
      urgency: escDept.unresolved > 5 ? "critical" : "high",
      confidence: 89,
      impact: "high",
      affectedCount: escDept.unresolved,
      departments: [escDept.department],
      actionLabel: "Open escalation center",
      href: "/admin/escalations",
      factors: ["Escalation density", "Unresolved SLA breaches"],
    });
  }

  if ((kpis.delayedApprovals ?? 0) > 3) {
    recs.push({
      id: "rec-approvals",
      title: "Intervene in delayed approval pipeline",
      description: `${kpis.delayedApprovals} goal sheets exceed approval SLA. Operations bottleneck detected.`,
      urgency: (kpis.delayedApprovals ?? 0) > 10 ? "critical" : "medium",
      confidence: 86,
      impact: "medium",
      affectedCount: kpis.delayedApprovals,
      actionLabel: "Review approvals",
      href: "/manager/approvals",
      factors: ["Approval latency", "Submitted sheet backlog"],
    });
  }

  const criticalEmployees = snapshot.employeeRisks.filter((e) => e.level === "critical");
  if (criticalEmployees.length > 0) {
    recs.push({
      id: "rec-at-risk",
      title: `${criticalEmployees.length} employee${criticalEmployees.length > 1 ? "s" : ""} likely to miss goals`,
      description: `Critical risk band detected. Proactive manager coaching recommended before quarter-end.`,
      urgency: "high",
      confidence: 88,
      impact: "high",
      affectedCount: criticalEmployees.length,
      managers: Array.from(
        new Set(criticalEmployees.map((e) => e.managerName).filter(Boolean) as string[])
      ).slice(0, 3),
      actionLabel: "View at-risk panel",
      href: "/admin/executive#insights",
      factors: ["Critical risk scores", "Missed check-ins", "Low goal progress"],
    });
  }

  const slowManagers = snapshot.managerRisks.filter((m) => m.score > 55).slice(0, 3);
  for (const mgr of slowManagers) {
    recs.push({
      id: `rec-mgr-${mgr.id}`,
      title: `${mgr.name} requires leadership attention`,
      description: `Manager effectiveness score indicates delayed reviews and elevated team risk (${mgr.score}/100 risk).`,
      urgency: mgr.score > 70 ? "high" : "medium",
      confidence: 84,
      impact: "medium",
      managers: [mgr.name],
      departments: mgr.department ? [mgr.department] : [],
      actionLabel: "View team analytics",
      href: "/manager/analytics",
      factors: mgr.factors.map((f) => f.label),
    });
  }

  if ((kpis.sharedGoalAdoption ?? 0) < 35) {
    recs.push({
      id: "rec-shared-goals",
      title: "Shared goal participation declining",
      description: `Only ${kpis.sharedGoalAdoption}% adoption of strategic shared goals. Alignment opportunity.`,
      urgency: "medium",
      confidence: 80,
      impact: "medium",
      actionLabel: "Manage shared goals",
      href: "/admin/shared-goals",
      factors: ["Low shared goal adoption", "Strategic alignment gap"],
    });
  }

  const inactive = snapshot.employeeRisks.filter((e) =>
    e.factors.some((f) => f.factor === "inactive_employee")
  );
  if (inactive.length > 0) {
    recs.push({
      id: "rec-inactive",
      title: "Address inactive employee participation",
      description: `${inactive.length} employees show inactivity signals affecting organizational participation rate.`,
      urgency: "medium",
      confidence: 82,
      impact: "medium",
      affectedCount: inactive.length,
      actionLabel: "Review users",
      href: "/admin/users",
      factors: ["Inactive employees", "Missed submissions"],
    });
  }

  return recs
    .sort((a, b) => urgencyWeight(b.urgency) - urgencyWeight(a.urgency))
    .slice(0, 8);
}

function urgencyWeight(u: LeadershipRecommendation["urgency"]) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[u];
}
