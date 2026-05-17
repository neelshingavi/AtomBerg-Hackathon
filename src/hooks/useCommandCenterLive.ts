"use client";

import { useQuery } from "@tanstack/react-query";
import type { CommandCenterLive } from "@/lib/realtime/types";

export function useCommandCenterLive() {
  return useQuery({
    queryKey: ["command-center-live"],
    queryFn: async () => {
      const res = await fetch("/api/realtime/command-center");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as CommandCenterLive;
    },
    refetchInterval: 10_000,
  });
}
