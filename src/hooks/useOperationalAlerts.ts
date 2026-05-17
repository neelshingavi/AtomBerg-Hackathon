"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OperationalAlertItem } from "@/lib/realtime/types";

export function useOperationalAlerts() {
  return useQuery({
    queryKey: ["operational-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/realtime/alerts");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.alerts as OperationalAlertItem[];
    },
    refetchInterval: 12_000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/realtime/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["operational-alerts"] }),
  });
}
