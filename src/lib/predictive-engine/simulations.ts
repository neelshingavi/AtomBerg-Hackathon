import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import { computeWeightedHealth } from "@/lib/health-engine/scoring";
import type { ScenarioInput, ScenarioResult } from "./types";
import { clamp } from "./utils";

export function runScenario(
  snapshot: IntelligenceSnapshot,
  input: ScenarioInput
): ScenarioResult {
  const kpis = kpiMap(snapshot);
  const { overallScore } = computeWeightedHealth(snapshot);

  const baseline = {
    healthScore: overallScore,
    completionPct: kpis.orgGoalCompletion ?? 0,
    escalationCount: kpis.activeEscalations ?? 0,
    alignmentScore: kpis.sharedGoalAdoption ?? 0,
  };

  let health = baseline.healthScore;
  let completion = baseline.completionPct;
  let escalations = baseline.escalationCount;
  let alignment = baseline.alignmentScore;

  const parts: string[] = [];

  if (input.approvalDelayPct) {
    const impact = Math.round(input.approvalDelayPct * 0.35);
    health -= impact;
    completion -= Math.round(input.approvalDelayPct * 0.25);
    parts.push(`approvals slow by ${input.approvalDelayPct}%`);
  }

  if (input.escalationMultiplier && input.escalationMultiplier > 1) {
    escalations = Math.round(escalations * input.escalationMultiplier);
    health -= Math.round((input.escalationMultiplier - 1) * 12);
    parts.push(`escalation volume ×${input.escalationMultiplier}`);
  }

  if (input.checkinMissRatePct) {
    health -= Math.round(input.checkinMissRatePct * 0.3);
    completion -= Math.round(input.checkinMissRatePct * 0.2);
    parts.push(`check-in miss rate +${input.checkinMissRatePct}%`);
  }

  if (input.managerResponsivenessPct && input.managerResponsivenessPct < 0) {
    health += input.managerResponsivenessPct * 0.4;
    completion += input.managerResponsivenessPct * 0.25;
    parts.push(`manager responsiveness ${input.managerResponsivenessPct}%`);
  }

  if (input.sharedGoalFailurePct) {
    alignment -= Math.round(input.sharedGoalFailurePct * 0.5);
    health -= Math.round(input.sharedGoalFailurePct * 0.2);
    parts.push(`shared goal failure rate ${input.sharedGoalFailurePct}%`);
  }

  if (input.engineeringMissMilestones) {
    health -= 8;
    completion -= 12;
    alignment -= 10;
    parts.push("Engineering misses key milestones");
  }

  const projected = {
    healthScore: clamp(Math.round(health)),
    completionPct: clamp(Math.round(completion)),
    escalationCount: Math.max(0, Math.round(escalations)),
    alignmentScore: clamp(Math.round(alignment)),
  };

  const deltas = [
    {
      metric: "Organization Health",
      change: projected.healthScore - baseline.healthScore,
      unit: "pts",
    },
    {
      metric: "Goal Completion",
      change: projected.completionPct - baseline.completionPct,
      unit: "%",
    },
    {
      metric: "Active Escalations",
      change: projected.escalationCount - baseline.escalationCount,
      unit: "count",
    },
    {
      metric: "Strategic Alignment",
      change: projected.alignmentScore - baseline.alignmentScore,
      unit: "%",
    },
  ];

  const scenarioLabel = parts.length > 0 ? parts.join("; ") : "Baseline (no changes)";

  const narrative =
    projected.healthScore < baseline.healthScore - 10
      ? `Under this scenario, organization health could decline to ${projected.healthScore}/100 with material impact on cycle completion and strategic alignment. Leadership intervention recommended.`
      : projected.healthScore > baseline.healthScore + 5
        ? `Scenario projects improvement to ${projected.healthScore}/100 health with strengthened execution outcomes.`
        : `Scenario shows moderate impact — health moves to ${projected.healthScore}/100 with manageable operational adjustments.`;

  return {
    scenarioLabel,
    baseline,
    projected,
    deltas,
    narrative,
    confidence: clamp(88 - parts.length * 4, 65, 92),
  };
}

export const PRESET_SCENARIOS: Array<{ id: string; label: string; input: ScenarioInput }> = [
  { id: "approval-slow", label: "Approvals slow 20%", input: { approvalDelayPct: 20 } },
  { id: "esc-double", label: "Escalations double", input: { escalationMultiplier: 2 } },
  { id: "eng-miss", label: "Engineering misses milestones", input: { engineeringMissMilestones: true } },
  { id: "mgr-decline", label: "Manager responsiveness -15%", input: { managerResponsivenessPct: -15 } },
  { id: "shared-fail", label: "Shared goals underperform 30%", input: { sharedGoalFailurePct: 30 } },
  { id: "checkin-miss", label: "Check-in miss rate +25%", input: { checkinMissRatePct: 25 } },
];
