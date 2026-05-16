"use client";

import { useQuery } from "@tanstack/react-query";

export function useCurrentCycle() {
  return useQuery({
    queryKey: ["cycles", "active"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load cycle");
      return json.data as {
        active: {
          id: string;
          name: string;
          fiscalYear: string;
          currentPhase: string;
          computedPhase: string;
          goalSettingStart: string;
          goalSettingEnd: string;
          q1WindowStart: string;
          q1WindowEnd: string;
          q2WindowStart: string;
          q2WindowEnd: string;
          q3WindowStart: string;
          q3WindowEnd: string;
          q4WindowStart: string;
          q4WindowEnd: string;
          quarterWindows: { Q1: boolean; Q2: boolean; Q3: boolean; Q4: boolean };
        } | null;
        cycles: unknown[];
      };
    },
  });
}
