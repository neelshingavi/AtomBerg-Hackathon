import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { HistoricalSeries } from "./historical";
import type { EarlyWarning } from "./types";
import { velocityScore } from "./utils";

export function buildEarlyWarnings(
  snapshot: IntelligenceSnapshot,
  history: HistoricalSeries
): EarlyWarning[] {
  const kpis = kpiMap(snapshot);
  const warnings: EarlyWarning[] = [];
  const now = new Date().toISOString();

  const escVel = velocityScore(history.escalations);
  if (escVel > 2) {
    const finance = snapshot.executive.departmentHealth.find((d) =>
      /fin/i.test(d.department)
    );
    warnings.push({
      id: "ew-esc-trend",
      type: escVel > 4 ? "critical" : "warning",
      title: "Escalation growth trend emerging",
      message: finance
        ? `Escalation growth trend emerging in ${finance.department} (+${escVel}/week velocity).`
        : `Escalation volume increasing at ${escVel} incidents per week.`,
      metric: `${kpis.activeEscalations ?? 0} active`,
      trendDirection: "up",
      confidence: 84,
      department: finance?.department,
      createdAt: now,
    });
  }

  const completionVel = velocityScore(history.completion);
  if (completionVel < -2) {
    warnings.push({
      id: "ew-completion",
      type: "warning",
      title: "Q2 completion velocity declining",
      message: `Completion velocity declining (${completionVel.toFixed(1)} pts/week). Proactive intervention recommended before quarter-end.`,
      metric: `${kpis.orgGoalCompletion ?? 0}%`,
      trendDirection: "down",
      confidence: 81,
      createdAt: now,
    });
  }

  const ops = snapshot.executive.departmentHealth.find((d) =>
    /operat/i.test(d.department)
  );
  if (ops && ops.delayedApprovals >= 2) {
    warnings.push({
      id: "ew-ops-approval",
      type: "warning",
      title: "Approval slowdown detected",
      message: `Approval slowdown detected in ${ops.department}. ${ops.delayedApprovals} approvals exceeding SLA.`,
      trendDirection: "down",
      confidence: 87,
      department: ops.department,
      createdAt: now,
    });
  }

  if ((kpis.managerReviewCompletion ?? 100) < 65) {
    warnings.push({
      id: "ew-manager-response",
      type: "warning",
      title: "Manager responsiveness dropped",
      message: "Manager responsiveness dropped significantly — review effectiveness across teams.",
      metric: `${kpis.managerReviewCompletion}%`,
      trendDirection: "down",
      confidence: 79,
      createdAt: now,
    });
  }

  const worst = [...snapshot.executive.departmentHealth].sort(
    (a, b) => a.completionPct - b.completionPct
  )[0];
  if (worst && worst.healthStatus === "critical") {
    warnings.push({
      id: `ew-dept-${worst.departmentId}`,
      type: "critical",
      title: `${worst.department} health critical`,
      message: `${worst.department} health entered critical zone — ${worst.completionPct}% completion with elevated risk.`,
      trendDirection: "down",
      confidence: 90,
      department: worst.department,
      createdAt: now,
    });
  }

  if ((kpis.atRiskEmployees ?? 0) > 5) {
    warnings.push({
      id: "ew-workforce",
      type: "warning",
      title: "Workforce risk cluster forming",
      message: `${kpis.atRiskEmployees} employees flagged at-risk — potential execution failure cluster forming.`,
      metric: String(kpis.atRiskEmployees),
      trendDirection: "up",
      confidence: 83,
      createdAt: now,
    });
  }

  return warnings.slice(0, 8);
}
