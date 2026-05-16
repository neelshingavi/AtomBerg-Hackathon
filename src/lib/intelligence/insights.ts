import type { DepartmentHealthRow } from "@/lib/reports/executive";
import type { RiskEntity } from "@/lib/risk/types";

export type ExecutiveInsight = {
  id: string;
  type: "positive" | "warning" | "critical" | "neutral";
  title: string;
  body: string;
  metric?: string;
};

export function generateExecutiveInsights(params: {
  kpis: Record<string, number>;
  departmentHealth: DepartmentHealthRow[];
  atRiskEmployees: RiskEntity[];
  previousQuarter?: string;
}): ExecutiveInsight[] {
  const insights: ExecutiveInsight[] = [];
  const { kpis, departmentHealth, atRiskEmployees, previousQuarter = "prior quarter" } = params;

  const topDept = [...departmentHealth].sort((a, b) => b.completionPct - a.completionPct)[0];
  const bottomDept = [...departmentHealth].sort((a, b) => a.completionPct - b.completionPct)[0];

  if (topDept && topDept.completionPct > 0) {
    const delta = topDept.trendPct;
    insights.push({
      id: "dept-improvement",
      type: delta >= 0 ? "positive" : "warning",
      title: `${topDept.department} leads organizational performance`,
      body:
        delta >= 0
          ? `${topDept.department} improved quarterly completion by ${Math.abs(delta)}% compared to ${previousQuarter}.`
          : `${topDept.department} maintains the highest completion at ${topDept.completionPct}% despite a ${Math.abs(delta)}% dip.`,
      metric: `${topDept.completionPct}%`,
    });
  }

  if (bottomDept && bottomDept !== topDept && bottomDept.completionPct < 50) {
    insights.push({
      id: "dept-lagging",
      type: "warning",
      title: `${bottomDept.department} needs support`,
      body: `${bottomDept.department} trails at ${bottomDept.completionPct}% completion with ${bottomDept.delayedCheckins} delayed check-ins.`,
      metric: `${bottomDept.completionPct}%`,
    });
  }

  const delayedApprovalsDept = departmentHealth.reduce(
    (worst, d) => (d.delayedApprovals > (worst?.delayedApprovals ?? 0) ? d : worst),
    departmentHealth[0]
  );
  if (delayedApprovalsDept && delayedApprovalsDept.delayedApprovals > 0) {
    insights.push({
      id: "delayed-approvals",
      type: "warning",
      title: "Approval bottlenecks detected",
      body: `${delayedApprovalsDept.department} has the highest delayed approvals (${delayedApprovalsDept.delayedApprovals} pending beyond SLA).`,
      metric: String(delayedApprovalsDept.delayedApprovals),
    });
  }

  const atRiskDepts = departmentHealth.filter((d) => d.healthStatus === "critical").length;
  if (atRiskDepts > 0) {
    insights.push({
      id: "at-risk-depts",
      type: "critical",
      title: "Departments require executive attention",
      body: `${atRiskDepts} department${atRiskDepts === 1 ? "" : "s"} ${atRiskDepts === 1 ? "is" : "are"} currently at risk due to missed check-ins and low completion trends.`,
      metric: String(atRiskDepts),
    });
  }

  if (kpis.activeEscalations > 5) {
    insights.push({
      id: "escalations",
      type: "critical",
      title: "Escalation volume elevated",
      body: `${kpis.activeEscalations} active escalations across the organization. Operations should prioritize manager SLA compliance.`,
      metric: String(kpis.activeEscalations),
    });
  }

  if (kpis.orgGoalCompletion >= 70) {
    insights.push({
      id: "org-health",
      type: "positive",
      title: "Organization on track",
      body: `Organizational goal completion stands at ${kpis.orgGoalCompletion}%, with ${kpis.checkinCompliance}% quarterly check-in compliance.`,
      metric: `${kpis.orgGoalCompletion}%`,
    });
  }

  if (atRiskEmployees.length > 0) {
    const critical = atRiskEmployees.filter((e) => e.level === "critical").length;
    if (critical > 0) {
      insights.push({
        id: "critical-employees",
        type: "critical",
        title: "Critical employee risk flagged",
        body: `${critical} employee${critical === 1 ? "" : "s"} scored in the critical risk band. Review manager interventions and escalation history.`,
        metric: String(critical),
      });
    }
  }

  if (kpis.sharedGoalAdoption < 40) {
    insights.push({
      id: "shared-goals",
      type: "neutral",
      title: "Shared goal adoption opportunity",
      body: `Shared goal adoption is at ${kpis.sharedGoalAdoption}%. Increasing alignment to company priorities could improve cross-functional outcomes.`,
      metric: `${kpis.sharedGoalAdoption}%`,
    });
  }

  return insights.slice(0, 6);
}
