import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import type { ManagerEffectivenessRow } from "./types";

export function buildManagerEffectiveness(
  snapshot: IntelligenceSnapshot
): ManagerEffectivenessRow[] {
  return snapshot.managerRisks.map((m) => {
    const responsiveness = Math.max(0, 100 - m.score);
    const pendingFactor = m.factors.find((f) => f.factor === "delayed_manager");
    const approvalSpeed = pendingFactor ? Math.max(20, 100 - pendingFactor.weight) : responsiveness;
    const escalationHandling = Math.max(
      0,
      100 - (m.escalationCount ?? 0) * 15
    );
    const teamParticipation = responsiveness;
    const executionConsistency = Math.round(
      (responsiveness + approvalSpeed + escalationHandling) / 3
    );
    const overallScore = executionConsistency;

    const trend: ManagerEffectivenessRow["trend"] =
      m.score >= 55 ? "declining" : m.score < 30 ? "strong" : "stable";

    let narrative = `${m.name} maintains ${trend} leadership effectiveness (${overallScore}/100).`;
    if (trend === "declining") {
      narrative = `Operations leadership for ${m.name} shows declining responsiveness — ${m.factors.map((f) => f.label).join("; ")}.`;
    } else if (trend === "strong") {
      narrative = `${m.name} demonstrates strongest execution reliability in ${m.department ?? "the organization"}.`;
    }

    return {
      id: m.id,
      name: m.name,
      department: m.department,
      responsiveness,
      approvalSpeed,
      escalationHandling,
      teamParticipation,
      executionConsistency,
      overallScore,
      narrative,
      trend,
    };
  }).sort((a, b) => b.overallScore - a.overallScore);
}
