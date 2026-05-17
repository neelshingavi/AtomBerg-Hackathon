import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { OrganizationPulse } from "@/lib/intelligence/types";

export function buildCopilotContext(params: {
  snapshot: IntelligenceSnapshot;
  pulse: OrganizationPulse;
  role: string;
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
Organization: ${process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"}
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
`.trim();
}
