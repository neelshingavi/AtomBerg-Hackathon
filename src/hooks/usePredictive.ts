"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentCycle } from "./useCurrentCycle";
import type { PredictiveSnapshot, ForecastHorizon } from "@/lib/predictive-engine/types";
import type { ScenarioInput, ScenarioResult } from "@/lib/predictive-engine/types";

function useCycleId() {
  const { data } = useCurrentCycle();
  return data?.active?.id;
}

export function usePredictiveForecast(horizon: ForecastHorizon = "quarter") {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["predictive", "forecast", cycleId, horizon],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(
        `/api/intelligence/forecast?cycleId=${cycleId}&horizon=${horizon}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as PredictiveSnapshot;
    },
    staleTime: 60_000,
  });
}

export function useScenarioSimulation() {
  const cycleId = useCycleId();
  return useMutation({
    mutationFn: async (input: ScenarioInput) => {
      const res = await fetch("/api/intelligence/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId, input }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ScenarioResult;
    },
  });
}
