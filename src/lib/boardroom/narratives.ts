import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { OrganizationPulse } from "@/lib/intelligence/types";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";
import type { ExecutiveNarrative, WhyItMattersItem } from "./types";

export function generateExecutiveNarratives(params: {
  snapshot: IntelligenceSnapshot;
  pulse: OrganizationPulse;
  predictive?: PredictiveSnapshot;
}): ExecutiveNarrative[] {
  const { snapshot, pulse, predictive } = params;
  const kpis = kpiMap(snapshot);
  const now = new Date().toISOString();

  const topDept = [...snapshot.executive.departmentHealth].sort(
    (a, b) => b.completionPct - a.completionPct
  )[0];
  const bottomDept = [...snapshot.executive.departmentHealth].sort(
    (a, b) => a.completionPct - b.completionPct
  )[0];

  const daily: ExecutiveNarrative = {
    id: "narrative-daily",
    period: "daily",
    headline: `Organization operating at ${pulse.stateLabel.toLowerCase()} health`,
    summary: pulse.narrative,
    paragraphs: [
      buildApprovalNarrative(snapshot, kpis),
      buildEscalationNarrative(snapshot, kpis),
      topDept
        ? `${topDept.department} leads execution at ${topDept.completionPct}% completion.`
        : "Department performance data is updating.",
    ],
    whyItMatters:
      "Daily execution signals determine whether quarterly strategic targets remain achievable.",
    generatedAt: now,
  };

  const weekly: ExecutiveNarrative = {
    id: "narrative-weekly",
    period: "weekly",
    headline: "Weekly executive operations summary",
    summary: predictive?.executiveNarrative ?? pulse.narrative,
    paragraphs: [
      `Workforce momentum at ${predictive?.momentum.overall ?? pulse.overallScore}/100 (${predictive?.momentum.trend ?? "stable"}).`,
      (kpis.sharedGoalAdoption ?? 0) > 45
        ? "Cross-functional alignment strengthened through increased shared-goal participation."
        : "Strategic alignment requires increased shared-goal adoption across departments.",
      bottomDept
        ? `${bottomDept.department} shows ${bottomDept.healthStatus} health — leadership review recommended.`
        : "",
    ].filter(Boolean),
    whyItMatters:
      "Weekly patterns reveal emerging bottlenecks before they impact cycle completion and board-level commitments.",
    generatedAt: now,
  };

  const quarterly: ExecutiveNarrative = {
    id: "narrative-quarterly",
    period: "quarterly",
    headline: `${snapshot.cycleName} strategic execution outlook`,
    summary: `Organization pulse ${pulse.overallScore}/100 with ${kpis.orgGoalCompletion ?? 0}% goal completion trajectory.`,
    paragraphs: [
      `Check-in compliance at ${kpis.checkinCompliance ?? 0}% across the workforce.`,
      `${snapshot.employeeRisks.filter((e) => e.level === "critical").length} employees in critical risk band.`,
      predictive
        ? `Forward outlook: ${predictive.overallRiskOutlook} risk profile for next quarter.`
        : "Predictive forecasting available in executive forecast mode.",
    ],
    whyItMatters:
      "Quarterly narratives inform board reporting, resource allocation, and strategic initiative prioritization.",
    generatedAt: now,
  };

  return [daily, weekly, quarterly];
}

export function generateWhyItMatters(params: {
  snapshot: IntelligenceSnapshot;
  pulse: OrganizationPulse;
  predictive?: PredictiveSnapshot;
}): WhyItMattersItem[] {
  const kpis = kpiMap(params.snapshot);
  const items: WhyItMattersItem[] = [];

  if ((kpis.delayedApprovals ?? 0) > 0) {
    items.push({
      id: "wim-approvals",
      metric: "Approval velocity",
      observation: `${kpis.delayedApprovals} approvals exceed SLA thresholds.`,
      businessImpact:
        "Rising approval delays may impact quarterly execution targets and strategic initiative timelines.",
      urgency: kpis.delayedApprovals > 5 ? "high" : "medium",
    });
  }

  if ((kpis.activeEscalations ?? 0) > 5) {
    const top = [...params.snapshot.escalations.byDepartment].sort(
      (a, b) => b.unresolved - a.unresolved
    )[0];
    items.push({
      id: "wim-escalations",
      metric: "Escalation volume",
      observation: `${kpis.activeEscalations} active escalations${top ? ` — ${top.department} highest density` : ""}.`,
      businessImpact:
        "Finance and Operations escalation growth indicates emerging execution bottlenecks requiring leadership intervention.",
      urgency: "high",
    });
  }

  if ((kpis.sharedGoalAdoption ?? 0) > 40) {
    items.push({
      id: "wim-alignment",
      metric: "Strategic alignment",
      observation: `Shared goal adoption at ${kpis.sharedGoalAdoption}%.`,
      businessImpact:
        "Cross-functional alignment strengthens organizational execution coherence and reduces siloed initiative risk.",
      urgency: "low",
    });
  } else {
    items.push({
      id: "wim-alignment-low",
      metric: "Strategic alignment",
      observation: `Shared goal adoption at ${kpis.sharedGoalAdoption ?? 0}% — below enterprise target.`,
      businessImpact:
        "Low strategic linkage increases orphan-goal risk and weakens board-level OKR attainment.",
      urgency: "medium",
    });
  }

  if (params.predictive?.predictions[0]) {
    const p = params.predictive.predictions[0];
    items.push({
      id: "wim-predictive",
      metric: "Predictive risk",
      observation: p.narrative,
      businessImpact: p.projectedImpact,
      urgency: p.severity === "critical" ? "critical" : "high",
    });
  }

  const completionTrend = params.snapshot.executive.kpis.find(
    (k) => k.key === "orgGoalCompletion"
  )?.trendPct;
  if (completionTrend != null && completionTrend < -3) {
    items.push({
      id: "wim-completion",
      metric: "Goal completion",
      observation: `Completion velocity declined ${Math.abs(completionTrend)}% this period.`,
      businessImpact:
        "Declining completion trends signal potential cycle-end shortfalls against revenue and operational commitments.",
      urgency: "high",
    });
  }

  return items.slice(0, 8);
}

function buildApprovalNarrative(
  snapshot: IntelligenceSnapshot,
  kpis: Record<string, number>
): string {
  const delayed = kpis.delayedApprovals ?? 0;
  if (delayed === 0) {
    return "Approval velocity remains within enterprise SLA across departments.";
  }
  const dept = [...snapshot.executive.departmentHealth].sort(
    (a, b) => b.delayedApprovals - a.delayedApprovals
  )[0];
  return dept
    ? `Operational efficiency pressured by ${delayed} delayed approvals — concentrated in ${dept.department}.`
    : `${delayed} delayed approvals impacting execution velocity.`;
}

function buildEscalationNarrative(
  snapshot: IntelligenceSnapshot,
  kpis: Record<string, number>
): string {
  const active = kpis.activeEscalations ?? 0;
  if (active === 0) return "Escalation volume is contained within normal operating bounds.";
  return `${active} active escalations; manager SLA compliance at ${snapshot.escalations.managerSlaCompliance}%.`;
}
