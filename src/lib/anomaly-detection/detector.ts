import type { AnomalyAlert } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";

export function detectAnomalies(snapshot: IntelligenceSnapshot): AnomalyAlert[] {
  const kpis = kpiMap(snapshot);
  const alerts: AnomalyAlert[] = [];

  for (const kpi of snapshot.executive.kpis) {
    if (Math.abs(kpi.trendPct) >= 15 && kpi.unit === "%") {
      alerts.push({
        id: `anomaly-${kpi.key}`,
        type: "metric_spike",
        title: `Unusual change in ${kpi.label}`,
        description: `${kpi.label} moved ${kpi.trendPct > 0 ? "up" : "down"} ${Math.abs(kpi.trendPct)}% vs prior period — outside normal variance.`,
        severity: kpi.trendPct < 0 && kpi.severity !== "healthy" ? "critical" : "warning",
        deltaPct: kpi.trendPct,
        currentValue: kpi.value,
        previousValue: kpi.previousValue,
        confidence: 78 + Math.min(Math.abs(kpi.trendPct), 20),
      });
    }
  }

  const escTrend = snapshot.escalations.trends.slice(-2);
  if (escTrend.length === 2) {
    const prev = escTrend[0].total;
    const curr = escTrend[1].total;
    if (prev > 0 && curr > prev * 1.2) {
      const delta = Math.round(((curr - prev) / prev) * 100);
      alerts.push({
        id: "anomaly-esc-spike",
        type: "escalation_spike",
        title: "Sudden escalation spike detected",
        description: `Escalations increased ${delta}% compared to the previous period.`,
        severity: delta > 30 ? "critical" : "warning",
        deltaPct: delta,
        currentValue: curr,
        previousValue: prev,
        confidence: 90,
      });
    }
  }

  const inactiveManagers = snapshot.managerRisks.filter((m) =>
    m.factors.some((f) => f.factor === "delayed_manager" || f.factor === "inactive_employee")
  );
  if (inactiveManagers.length >= 2) {
    alerts.push({
      id: "anomaly-mgr-inactivity",
      type: "manager_inactivity",
      title: "Manager inactivity pattern detected",
      description: `${inactiveManagers.length} managers show delayed review or inactivity signals.`,
      severity: "warning",
      deltaPct: inactiveManagers.length * 10,
      currentValue: inactiveManagers.length,
      previousValue: Math.max(0, inactiveManagers.length - 2),
      confidence: 85,
    });
  }

  const decliningDepts = snapshot.executive.departmentHealth.filter((d) => d.trendPct < -10);
  if (decliningDepts.length > 0) {
    alerts.push({
      id: "anomaly-dept-decline",
      type: "completion_decline",
      title: "Declining department completion",
      description: `${decliningDepts.map((d) => d.department).join(", ")} show abnormal completion declines.`,
      severity: "warning",
      deltaPct: Math.min(...decliningDepts.map((d) => d.trendPct)),
      currentValue: decliningDepts.length,
      previousValue: 0,
      confidence: 83,
    });
  }

  if ((kpis.atRiskEmployees ?? 0) > 8) {
    const prev = Math.max(0, (kpis.atRiskEmployees ?? 0) - 3);
    alerts.push({
      id: "anomaly-risk-surge",
      type: "risk_increase",
      title: "Abnormal workforce risk increase",
      description: `At-risk employee count (${kpis.atRiskEmployees}) exceeds typical organizational baseline.`,
      severity: "critical",
      deltaPct: Math.round((((kpis.atRiskEmployees ?? 0) - prev) / Math.max(prev, 1)) * 100),
      currentValue: kpis.atRiskEmployees ?? 0,
      previousValue: prev,
      confidence: 88,
    });
  }

  return alerts.sort((a, b) => {
    const sw = { critical: 3, warning: 2, positive: 1, informational: 0 };
    return sw[b.severity] - sw[a.severity];
  });
}
