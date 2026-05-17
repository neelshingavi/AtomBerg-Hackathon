"use client";

import { useQuery } from "@tanstack/react-query";
import type { LiveStreamEvent } from "@/lib/realtime/types";

export function useLiveActivityStream(limit = 40) {
  return useQuery({
    queryKey: ["live-activity-stream", limit],
    queryFn: async () => {
      const res = await fetch(`/api/realtime/activity-stream?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.items as LiveStreamEvent[];
    },
    refetchInterval: 8_000,
  });
}
