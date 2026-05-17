"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentCycle } from "./useCurrentCycle";
import type { OrganizationPulse } from "@/lib/intelligence/types";
import type { IntelligenceInsight } from "@/lib/intelligence/types";
import type { LeadershipRecommendation } from "@/lib/intelligence/types";
import type { AnomalyAlert } from "@/lib/intelligence/types";
import type { ExecutiveBriefing } from "@/lib/intelligence/types";
import type { CopilotResponse } from "@/lib/intelligence/types";

function useCycleId() {
  const { data } = useCurrentCycle();
  return data?.active?.id;
}

export function useOrganizationPulse() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "pulse", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/pulse?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as OrganizationPulse;
    },
    staleTime: 60_000,
  });
}

export function useIntelligenceInsights() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "insights", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/insights?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.insights as IntelligenceInsight[];
    },
    staleTime: 60_000,
  });
}

export function useLeadershipRecommendations() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "recommendations", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/recommendations?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.recommendations as LeadershipRecommendation[];
    },
    staleTime: 60_000,
  });
}

export function useAnomalies() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "anomalies", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/anomalies?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.anomalies as AnomalyAlert[];
    },
    staleTime: 60_000,
  });
}

export function useExecutiveBriefing() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "briefing", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/briefing?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ExecutiveBriefing;
    },
    staleTime: 90_000,
  });
}

export function useWhatChanged() {
  const cycleId = useCycleId();
  return useQuery({
    queryKey: ["intelligence", "what-changed", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/intelligence/what-changed?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        periodLabel: string;
        items: Array<{ metric: string; interpretation: string; deltaPct: number; direction: string }>;
        executiveSummary: string;
      };
    },
    staleTime: 60_000,
  });
}

export async function sendCopilotMessage(
  message: string,
  cycleId?: string,
  options?: { stream?: boolean; onToken?: (chunk: string) => void }
): Promise<{ response: CopilotResponse; cycleName: string }> {
  if (options?.stream) {
    const res = await fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, cycleId, stream: true }),
    });
    if (!res.ok || !res.body) {
      return sendCopilotMessage(message, cycleId);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let structured: CopilotResponse | null = null;
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as {
            type: string;
            data?: CopilotResponse | string;
          };
          if (parsed.type === "structured" && parsed.data && typeof parsed.data === "object") {
            structured = parsed.data as CopilotResponse;
          }
          if (parsed.type === "token" && typeof parsed.data === "string") {
            options.onToken?.(parsed.data);
          }
        } catch {
          /* skip malformed chunks */
        }
      }
    }
    if (structured) {
      return { response: structured, cycleName: "Active cycle" };
    }
  }

  const res = await fetch("/api/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, cycleId }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return {
    response: json.data.response,
    cycleName: json.data.cycleName,
  };
}
