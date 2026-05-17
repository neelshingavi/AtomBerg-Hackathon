import type { WhatChangedItem } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";

export function buildWhatChanged(snapshot: IntelligenceSnapshot): {
  periodLabel: string;
  items: WhatChangedItem[];
  executiveSummary: string;
} {
  const items: WhatChangedItem[] = [];

  for (const kpi of snapshot.executive.kpis) {
    if (kpi.trendPct === 0) continue;
    const direction = kpi.trendPct > 0 ? "up" : kpi.trendPct < 0 ? "down" : "stable";
    let interpretation = `${kpi.label} ${direction === "up" ? "improved" : "declined"} by ${Math.abs(kpi.trendPct)}%.`;
    if (kpi.key === "delayedApprovals" && kpi.trendPct < 0) {
      interpretation = `Approval turnaround improved — ${Math.abs(kpi.trendPct)}% fewer delayed approvals.`;
    }
    if (kpi.key === "activeEscalations" && kpi.trendPct > 0) {
      interpretation = `Escalations increased ${kpi.trendPct}% compared to last week — leadership attention advised.`;
    }
    items.push({
      metric: kpi.label,
      direction,
      deltaPct: kpi.trendPct,
      current: kpi.value,
      previous: kpi.previousValue,
      interpretation,
    });
  }

  const escRecent = snapshot.escalations.unresolvedCount;
  items.push({
    metric: "Unresolved escalations",
    direction: escRecent > 10 ? "up" : "stable",
    deltaPct: snapshot.executive.kpis.find((k) => k.key === "activeEscalations")?.trendPct ?? 0,
    current: escRecent,
    previous: Math.max(0, escRecent - 3),
    interpretation:
      escRecent > 10
        ? `${escRecent} escalations remain open — operational bottleneck.`
        : "Escalation volume within manageable range.",
  });

  const improving = snapshot.executive.departmentHealth.filter((d) => d.trendPct > 5);
  if (improving.length > 0) {
    items.push({
      metric: "Department momentum",
      direction: "up",
      deltaPct: Math.max(...improving.map((d) => d.trendPct)),
      current: improving.length,
      previous: 0,
      interpretation: `${improving.map((d) => d.department).join(", ")} improved completion consistency.`,
    });
  }

  const summaryParts = items.slice(0, 3).map((i) => i.interpretation);
  const executiveSummary =
    summaryParts.length > 0
      ? `This week: ${summaryParts.join(" ")}`
      : "Organizational metrics remain stable with no significant week-over-week shifts.";

  return {
    periodLabel: "Last 7 days",
    items: items.slice(0, 8),
    executiveSummary,
  };
}
