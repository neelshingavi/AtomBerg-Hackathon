import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import type { DepartmentStoryboard } from "./types";

export function buildDepartmentStoryboards(
  snapshot: IntelligenceSnapshot
): DepartmentStoryboard[] {
  return snapshot.executive.departmentHealth.map((d) => {
    const riskTrajectory =
      d.trendPct > 2 ? "improving" : d.trendPct < -2 ? "declining" : "stable";
    const managerEffectiveness = Math.max(
      0,
      Math.min(100, d.managerResponsiveness - d.delayedApprovals * 5)
    );
    const alignmentScore = Math.round(
      d.completionPct * 0.6 + (100 - d.riskScore) * 0.4
    );

    const aiSummary = `${d.department} operates at ${d.completionPct}% completion with ${d.healthStatus} health status. ${d.escalationCount} active escalations and ${d.delayedCheckins} at-risk check-ins shape the current trajectory.`;

    const whyItMatters =
      d.healthStatus === "critical"
        ? `${d.department} underperformance may cascade to cycle completion and cross-functional dependencies.`
        : d.completionPct >= 70
          ? `${d.department} execution strength supports enterprise OKR attainment and regional targets.`
          : `${d.department} requires targeted leadership support to stabilize quarterly outcomes.`;

    return {
      departmentId: d.departmentId,
      department: d.department,
      completionPct: d.completionPct,
      healthStatus: d.healthStatus,
      riskTrajectory,
      managerEffectiveness,
      escalationTrend:
        d.escalationCount > 2
          ? `Elevated (${d.escalationCount} open)`
          : d.escalationCount > 0
            ? "Moderate"
            : "Contained",
      alignmentScore,
      collaborationNote:
        d.delayedApprovals > 2
          ? "Approval collaboration needs improvement"
          : "Cross-team collaboration within norms",
      aiSummary,
      whyItMatters,
    };
  });
}
