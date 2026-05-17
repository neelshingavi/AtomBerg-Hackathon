import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { kpiMap } from "@/lib/intelligence/snapshot";
import type { HistoricalSeries } from "./historical";
import type { TrajectoryForecast } from "./types";
import { projectValue, linearTrend } from "./utils";

export function buildTrajectories(
  snapshot: IntelligenceSnapshot,
  history: HistoricalSeries
): TrajectoryForecast[] {
  const kpis = kpiMap(snapshot);
  const metrics: Array<{
    key: string;
    label: string;
    history: number[];
    current: number;
  }> = [
    {
      key: "completion",
      label: "Goal Completion",
      history: history.completion,
      current: kpis.orgGoalCompletion ?? history.completion[history.completion.length - 1] ?? 0,
    },
    {
      key: "health",
      label: "Organization Health",
      history: history.health,
      current: history.health[history.health.length - 1] ?? 70,
    },
    {
      key: "escalations",
      label: "Escalation Density",
      history: history.escalations,
      current: kpis.activeEscalations ?? history.escalations[history.escalations.length - 1] ?? 0,
    },
    {
      key: "approvals",
      label: "Approval Velocity",
      history: history.approvals,
      current: history.approvals[history.approvals.length - 1] ?? 70,
    },
    {
      key: "checkins",
      label: "Check-in Compliance",
      history: history.completion.map((c) => Math.min(100, c + 5)),
      current: kpis.checkinCompliance ?? 65,
    },
    {
      key: "participation",
      label: "Participation Rate",
      history: history.completion.map((c, i) =>
        Math.round(c * 0.85 + history.approvals[i] * 0.15)
      ),
      current: Math.round(
        ((kpis.orgGoalCompletion ?? 0) + (kpis.checkinCompliance ?? 0)) / 2
      ),
    },
  ];

  return metrics.map((m) => {
    const { value: projected, confidence } = projectValue(m.history, 3);
    const { slope } = linearTrend(m.history);
    const direction =
      slope > 1.5 ? "improving" : slope < -1.5 ? "declining" : "stable";

    const points: TrajectoryForecast["points"] = history.labels.map((label, i) => ({
      period: label,
      label,
      actual: m.history[i],
      predicted: m.history[i],
      lower: Math.max(0, m.history[i] - 8),
      upper: Math.min(100, m.history[i] + 8),
      confidence: 88,
    }));

    const futureLabels = ["+2w", "+4w", "+6w"];
    for (let f = 0; f < 3; f++) {
      const { value, confidence: fc } = projectValue(m.history, f + 1);
      const spread = 12 - f * 2;
      points.push({
        period: futureLabels[f],
        label: futureLabels[f],
        predicted: value,
        lower: Math.max(0, value - spread),
        upper: Math.min(m.key === "escalations" ? 50 : 100, value + spread),
        confidence: fc,
      });
    }

    return {
      metric: m.key,
      label: m.label,
      current: m.current,
      projected,
      direction,
      confidence,
      points,
    };
  });
}
