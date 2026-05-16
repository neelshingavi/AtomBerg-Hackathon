"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Quarter } from "@/lib/cycle";

export type AchievementGoal = {
  id: string;
  title: string;
  description: string | null;
  uomType: string;
  plannedTarget: number;
  targetDeadline: string | null;
  unit: string | null;
  weightage: number;
  isShared: boolean;
  thrustArea: { name: string; color: string };
  achievements: Array<{
    id: string;
    quarter: string;
    actualValue: number | null;
    completionDate: string | null;
    status: string;
    progressScore: number | null;
    remark: string | null;
  }>;
};

async function parseResponse(res: Response) {
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

export function useAchievementSheet(goalSheetId: string | undefined, quarter?: Quarter) {
  return useQuery({
    queryKey: ["achievements", goalSheetId, quarter],
    enabled: Boolean(goalSheetId),
    queryFn: async () => {
      const qs = new URLSearchParams({ goalSheetId: goalSheetId! });
      if (quarter) qs.set("quarter", quarter);
      const res = await fetch(`/api/achievements?${qs}`);
      return (await parseResponse(res)) as {
        goalSheet: {
          id: string;
          status: string;
          isLocked: boolean;
          cycleId: string;
          cycle: { id: string; name: string };
          goals: AchievementGoal[];
        };
        quarterWindows: Record<Quarter, boolean>;
      };
    },
  });
}

export function useSaveAchievements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      goalSheetId: string;
      quarter: Quarter;
      cycleId: string;
      achievements: Array<{
        goalId: string;
        actualValue?: number | null;
        completionDate?: string | null;
        status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED";
        remark?: string | null;
      }>;
    }) => {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseResponse(res);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["achievements", vars.goalSheetId] });
      void qc.invalidateQueries({ queryKey: ["goalSheets"] });
      void qc.invalidateQueries({ queryKey: ["goalSheet", vars.goalSheetId] });
    },
  });
}
