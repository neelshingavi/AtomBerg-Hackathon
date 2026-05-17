"use client";

import { RiskHeatmap } from "@/components/forecasting/RiskHeatmap";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";

export function ExecutiveHeatmapBriefing({
  predictive,
}: {
  predictive?: PredictiveSnapshot;
}) {
  if (!predictive?.heatmap.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Operational Risk Heatmap</h2>
      <RiskHeatmap cells={predictive.heatmap} />
    </section>
  );
}
