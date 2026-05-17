"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentCycle } from "./useCurrentCycle";
import type {
  AlignmentGraphPayload,
  AlignmentScores,
  GraphViewMode,
  NodeDetailPayload,
  TimelineFrame,
} from "@/lib/alignment/types";

export type AlignmentGraphData = AlignmentGraphPayload & { scores: AlignmentScores };

function useCycleId() {
  const { data } = useCurrentCycle();
  return data?.active?.id;
}

export function useAlignmentGraph(expand = false) {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["alignment", "graph", cycleId, expand],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(
        `/api/intelligence/alignment-graph?cycleId=${cycleId}&expand=${expand}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AlignmentGraphData;
    },
    staleTime: 60_000,
  });
}

export function useAlignmentTimeline() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["alignment", "timeline", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/alignment-graph/timeline?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.frames as TimelineFrame[];
    },
    staleTime: 120_000,
  });
}

export function useNodeDetail() {
  const cycleId = useCycleId();
  return useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch("/api/intelligence/alignment-graph/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, cycleId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as NodeDetailPayload;
    },
  });
}

export type { GraphViewMode };
