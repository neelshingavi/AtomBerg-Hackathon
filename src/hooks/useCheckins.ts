"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Quarter } from "@/lib/cycle";

async function parseResponse(res: Response) {
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

export function useCheckinComments(goalSheetId: string | undefined, quarter?: Quarter) {
  return useQuery({
    queryKey: ["checkins", goalSheetId, quarter],
    enabled: Boolean(goalSheetId),
    queryFn: async () => {
      const qs = new URLSearchParams({ goalSheetId: goalSheetId! });
      if (quarter) qs.set("quarter", quarter);
      const res = await fetch(`/api/checkins?${qs}`);
      const data = await parseResponse(res);
      return data.comments as Array<{
        id: string;
        quarter: string;
        comment: string;
        rating: number | null;
        isPrivate: boolean;
        manager: { name: string };
        createdAt: string;
      }>;
    },
  });
}

export function useSaveCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      goalSheetId: string;
      quarter: Quarter;
      comment: string;
      rating?: number;
      isPrivate?: boolean;
    }) => {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await parseResponse(res);
    },
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["checkins", vars.goalSheetId] });
    },
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      return (await parseResponse(res)) as {
        cycle: { id: string; name: string } | null;
        team: Array<{
          id: string;
          name: string;
          employeeCode: string;
          department: { name: string };
          goalSheets: Array<{
            id: string;
            status: string;
            goals: Array<{
              achievements: Array<{ quarter: string; status: string }>;
            }>;
          }>;
        }>;
      };
    },
  });
}
