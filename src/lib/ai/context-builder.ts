import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { OrganizationPulse } from "@/lib/intelligence/types";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";

export function buildCopilotContext(params: {
  snapshot: IntelligenceSnapshot;
  pulse: OrganizationPulse;
  role: string;
  predictive?: PredictiveSnapshot;
}): string {
  const { snapshot, pulse, role } = params;
  const kpis = kpiMap(snapshot);

  const deptLines = snapshot.executive.departmentHealth
    .map(
      (d) =>
        `- ${d.department}: ${d.completionPct}% completion, risk ${d.riskScore}, ${d.delayedApprovals} delayed approvals, ${d.escalationCount} escalations, status ${d.healthStatus}`
    )
    .join("\n");

  const riskEmployees = snapshot.employeeRisks
    .slice(0, 10)
    .map((e) => `- ${e.name} (${e.department ?? "—"}): risk ${e.score}, level ${e.level}`)
    .join("\n");

  const managers = snapshot.managerRisks
    .slice(0, 8)
    .map((m) => `- ${m.name}: risk score ${m.score}, factors: ${m.factors.map((f) => f.label).join(", ")}`)
    .join("\n");

  return `
Organization: ${process.env.NEXT_PUBLIC_APP_NAME ?? "AtomQuest"}
Cycle: ${snapshot.cycleName} (${snapshot.cycleId})
User role: ${role}
Generated: ${snapshot.generatedAt}

ORGANIZATION PULSE: ${pulse.overallScore}/100 (${pulse.stateLabel})
${pulse.narrative}

KEY METRICS:
- Goal completion: ${kpis.orgGoalCompletion ?? 0}%
- Check-in compliance: ${kpis.checkinCompliance ?? 0}%
- Delayed approvals: ${kpis.delayedApprovals ?? 0}
- Active escalations: ${kpis.activeEscalations ?? 0}
- At-risk employees: ${kpis.atRiskEmployees ?? 0}
- Shared goal adoption: ${kpis.sharedGoalAdoption ?? 0}%
- Manager review completion: ${kpis.managerReviewCompletion ?? 0}%

DEPARTMENTS:
${deptLines || "No department data"}

AT-RISK EMPLOYEES:
${riskEmployees || "None flagged"}

MANAGERS:
${managers || "No manager risk data"}

ESCALATIONS: ${snapshot.escalations.unresolvedCount} unresolved, SLA compliance ${snapshot.escalations.managerSlaCompliance}%
${params.predictive ? formatPredictiveBlock(params.predictive) : ""}
`.trim();
}

function formatPredictiveBlock(p: PredictiveSnapshot): string {
  const topRisks = p.predictions
    .slice(0, 5)
    .map((r) => `- ${r.title}: ${r.probability}% prob (${r.confidence}% conf) — ${r.projectedImpact}`)
    .join("\n");
  const warnings = p.earlyWarnings
    .slice(0, 4)
    .map((w) => `- [${w.type}] ${w.title}: ${w.message}`)
    .join("\n");
  return `

PREDICTIVE FORECAST (${p.horizon} horizon):
${p.executiveNarrative}
Momentum: ${p.momentum.overall}/100 (${p.momentum.trend})
Stability: ${p.stability.overall}%
Outlook: ${p.overallRiskOutlook}

TOP PREDICTED RISKS:
${topRisks || "None"}

EARLY WARNINGS:
${warnings || "None"}
`;
}
