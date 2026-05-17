import type { IntelligenceInsight } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import { generateExecutiveInsights } from "@/lib/intelligence/insights";

export function generateIntelligenceInsights(
  snapshot: IntelligenceSnapshot
): IntelligenceInsight[] {
  const kpis = kpiMap(snapshot);
  const base = generateExecutiveInsights({
    kpis,
    departmentHealth: snapshot.executive.departmentHealth,
    atRiskEmployees: snapshot.employeeRisks,
  });

  const insights: IntelligenceInsight[] = base.map((b) => ({
    id: b.id,
    priority: b.type === "neutral" ? "informational" : b.type,
    category: mapCategory(b.id),
    title: b.title,
    body: b.body,
    metric: b.metric,
    confidence: 85,
    recommendation: deriveRecommendation(b.id, snapshot),
    affectedDepartments: affectedDepts(b.id, snapshot),
  }));

  const deptByEsc = [...snapshot.escalations.byDepartment].sort(
    (a, b) => b.unresolved - a.unresolved
  )[0];
  if (deptByEsc && deptByEsc.unresolved > 2) {
    insights.push({
      id: "esc-density",
      priority: "warning",
      category: "escalation",
      title: `${deptByEsc.department} has highest escalation density`,
      body: `${deptByEsc.unresolved} unresolved escalations with avg resolution ${deptByEsc.avgResolutionDays} days.`,
      metric: String(deptByEsc.unresolved),
      trendPct: 12,
      confidence: 91,
      recommendation: `Review ${deptByEsc.department} escalation backlog with department leadership.`,
      affectedDepartments: [deptByEsc.department],
    });
  }

  const fastMgr = snapshot.managerRisks
    .filter((m) => m.score < 35)
    .slice(0, 1)[0];
  if (fastMgr) {
    insights.push({
      id: "mgr-responsive",
      priority: "positive",
      category: "manager",
      title: `${fastMgr.name} demonstrates strong manager effectiveness`,
      body: `Low risk score (${fastMgr.score}) indicates timely reviews and proactive team management.`,
      confidence: 88,
      recommendation: "Consider sharing best practices across manager cohort.",
      affectedDepartments: fastMgr.department ? [fastMgr.department] : [],
    });
  }

  if ((kpis.orgGoalCompletion ?? 0) > 0) {
    const delta = snapshot.executive.kpis.find((k) => k.key === "orgGoalCompletion")?.trendPct ?? 0;
    if (Math.abs(delta) >= 5) {
      insights.push({
        id: "completion-trend",
        priority: delta >= 0 ? "positive" : "warning",
        category: "execution",
        title:
          delta >= 0
            ? "Approval velocity improved across the organization"
            : "Approval velocity dropped this period",
        body:
          delta >= 0
            ? `Goal completion trend moved ${Math.abs(delta)}% positively vs prior period.`
            : `Approval velocity dropped ${Math.abs(delta)}% this week — investigate manager SLA compliance.`,
        metric: `${delta > 0 ? "+" : ""}${delta}%`,
        trendPct: delta,
        confidence: 87,
        recommendation:
          delta < 0
            ? "Prioritize manager approval queues in Operations and Finance."
            : "Maintain current execution cadence.",
      });
    }
  }

  const crossAlign = kpis.sharedGoalAdoption ?? 0;
  if (crossAlign > 50) {
    insights.push({
      id: "cross-align",
      priority: "positive",
      category: "alignment",
      title: "Cross-functional alignment increased",
      body: `Shared goal adoption at ${crossAlign}% indicates stronger strategic initiative participation.`,
      metric: `${crossAlign}%`,
      confidence: 84,
    });
  }

  return insights
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority))
    .slice(0, 12);
}

function priorityWeight(p: IntelligenceInsight["priority"]) {
  const w = { critical: 4, warning: 3, positive: 2, informational: 1 };
  return w[p];
}

function mapCategory(id: string): IntelligenceInsight["category"] {
  if (id.includes("dept") || id.includes("dept")) return "department";
  if (id.includes("escalation") || id.includes("esc")) return "escalation";
  if (id.includes("mgr") || id.includes("manager")) return "manager";
  if (id.includes("approval")) return "approval";
  if (id.includes("risk") || id.includes("employee")) return "risk";
  if (id.includes("shared") || id.includes("align")) return "alignment";
  return "execution";
}

function deriveRecommendation(id: string, snapshot: IntelligenceSnapshot): string | undefined {
  if (id === "delayed-approvals") return "Schedule leadership review of approval SLAs.";
  if (id === "escalations") return "Activate escalation war-room for unresolved items.";
  if (id === "critical-employees") return "Direct manager coaching for at-risk employees.";
  if (id === "dept-lagging") {
    const d = [...snapshot.executive.departmentHealth].sort(
      (a, b) => a.completionPct - b.completionPct
    )[0];
    return d ? `Intervene in ${d.department} completion program.` : undefined;
  }
  return undefined;
}

function affectedDepts(id: string, snapshot: IntelligenceSnapshot): string[] | undefined {
  if (id.startsWith("dept-") || id === "dept-lagging") {
    const d = [...snapshot.executive.departmentHealth].sort(
      (a, b) => a.completionPct - b.completionPct
    )[0];
    return d ? [d.department] : undefined;
  }
  if (id === "delayed-approvals") {
    const worst = snapshot.executive.departmentHealth.reduce((w, d) =>
      d.delayedApprovals > (w?.delayedApprovals ?? 0) ? d : w
    );
    return worst ? [worst.department] : undefined;
  }
  return undefined;
}
