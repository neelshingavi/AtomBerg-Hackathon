import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { generateLeadershipRecommendations } from "@/lib/recommendations/engine";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";
import type { LeadershipPriority } from "./types";

const URGENCY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
const IMPACT_ORDER = { high: 3, medium: 2, low: 1 };

export function generateLeadershipPriorities(params: {
  snapshot: IntelligenceSnapshot;
  predictive?: PredictiveSnapshot;
}): LeadershipPriority[] {
  const recs = generateLeadershipRecommendations(params.snapshot);
  const items: LeadershipPriority[] = [];

  for (const r of recs) {
    items.push({
      id: `priority-${r.id}`,
      rank: 0,
      title: r.title,
      description: r.description,
      urgency: r.urgency,
      impact: r.impact,
      confidence: r.confidence,
      departments: r.departments ?? [],
      category: "recommendation",
    });
  }

  for (const bn of params.predictive?.bottlenecks.slice(0, 3) ?? []) {
    items.push({
      id: `priority-bn-${bn.id}`,
      rank: 0,
      title: bn.title,
      description: bn.description,
      urgency: bn.severity,
      impact: "high",
      confidence: bn.confidence,
      departments: bn.department ? [bn.department] : [],
      category: "bottleneck",
    });
  }

  for (const i of params.predictive?.interventions.slice(0, 3) ?? []) {
    items.push({
      id: `priority-int-${i.id}`,
      rank: 0,
      title: i.title,
      description: i.description,
      urgency: i.priority,
      impact: "high",
      confidence: i.confidence,
      departments: i.targetDepartments,
      category: "intervention",
    });
  }

  const sorted = items
    .sort(
      (a, b) =>
        URGENCY_ORDER[b.urgency] - URGENCY_ORDER[a.urgency] ||
        IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact] ||
        b.confidence - a.confidence
    )
    .slice(0, 8)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  if (sorted.length === 0) {
    sorted.push({
      id: "priority-maintain",
      rank: 1,
      title: "Maintain execution cadence",
      description: "Organization metrics within healthy thresholds — continue monitoring predictive signals.",
      urgency: "low",
      impact: "medium",
      confidence: 78,
      departments: [],
      category: "strategic",
    });
  }

  return sorted;
}
