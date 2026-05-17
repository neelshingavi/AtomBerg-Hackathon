"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentCycle } from "./useCurrentCycle";
import type { BoardroomSnapshot } from "@/lib/boardroom/types";

function useCycleId() {
  const { data } = useCurrentCycle();
  return data?.active?.id;
}

export function useBoardroomSnapshot() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["boardroom", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/boardroom?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as BoardroomSnapshot;
    },
    staleTime: 60_000,
  });
}
