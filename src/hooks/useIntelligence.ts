"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentCycle } from "./useCurrentCycle";
import type { OrganizationPulse } from "@/lib/intelligence/types";
import type { IntelligenceInsight } from "@/lib/intelligence/types";
import type { LeadershipRecommendation } from "@/lib/intelligence/types";
import type { AnomalyAlert } from "@/lib/intelligence/types";
import type { ExecutiveBriefing } from "@/lib/intelligence/types";
import type { CopilotResponse } from "@/lib/intelligence/types";
import {
  DEMO_FALLBACK_ANOMALIES,
  DEMO_FALLBACK_BRIEFING,
  DEMO_FALLBACK_COPILOT_SUMMARY,
  DEMO_FALLBACK_INSIGHTS,
  DEMO_FALLBACK_PULSE,
  DEMO_FALLBACK_RECOMMENDATIONS,
} from "@/lib/demo/fallbacks";
import { DEMO_QUERY_DEFAULTS, resilientJsonFetch } from "@/lib/demo/resilient-fetch";
import { isDemoModeEnabled } from "@/lib/demo/config";

function useCycleId() {
  const { data } = useCurrentCycle();
  return data?.active?.id;
}

const demoEnabled = () =>
  typeof window !== "undefined" && isDemoModeEnabled();

function intelligenceQueryOptions<T>(params: {
  queryKey: unknown[];
  enabled: boolean;
  url: string;
  fallback: T;
  staleTime?: number;
}) {
  const useFallbackPlaceholder = demoEnabled();
  return {
    queryKey: params.queryKey,
    enabled: params.enabled,
    queryFn: async () => {
      const { data } = await resilientJsonFetch<T>({
        url: params.url,
        fallback: params.fallback,
      });
      return data;
    },
    placeholderData: useFallbackPlaceholder ? params.fallback : undefined,
    staleTime: params.staleTime ?? DEMO_QUERY_DEFAULTS.staleTime,
    retry: DEMO_QUERY_DEFAULTS.retry,
    retryDelay: DEMO_QUERY_DEFAULTS.retryDelay,
    refetchOnWindowFocus: DEMO_QUERY_DEFAULTS.refetchOnWindowFocus,
  };
}

export function useOrganizationPulse() {
  const cycleId = useCycleId();
  return useQuery(
    intelligenceQueryOptions<OrganizationPulse>({
      queryKey: ["intelligence", "pulse", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/pulse?cycleId=${cycleId}`,
      fallback: DEMO_FALLBACK_PULSE,
      staleTime: 60_000,
    })
  );
}

export function useIntelligenceInsights() {
  const cycleId = useCycleId();
  return useQuery({
    ...intelligenceQueryOptions<{ insights: IntelligenceInsight[] }>({
      queryKey: ["intelligence", "insights", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/insights?cycleId=${cycleId}`,
      fallback: { insights: DEMO_FALLBACK_INSIGHTS },
      staleTime: 60_000,
    }),
    select: (data) => data.insights,
  });
}

export function useLeadershipRecommendations() {
  const cycleId = useCycleId();
  return useQuery({
    ...intelligenceQueryOptions<{ recommendations: LeadershipRecommendation[] }>({
      queryKey: ["intelligence", "recommendations", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/recommendations?cycleId=${cycleId}`,
      fallback: { recommendations: DEMO_FALLBACK_RECOMMENDATIONS },
      staleTime: 60_000,
    }),
    select: (data) => data.recommendations,
  });
}

export function useAnomalies() {
  const cycleId = useCycleId();
  return useQuery({
    ...intelligenceQueryOptions<{ anomalies: AnomalyAlert[] }>({
      queryKey: ["intelligence", "anomalies", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/anomalies?cycleId=${cycleId}`,
      fallback: { anomalies: DEMO_FALLBACK_ANOMALIES },
      staleTime: 60_000,
    }),
    select: (data) => data.anomalies,
  });
}

export function useExecutiveBriefing() {
  const cycleId = useCycleId();
  return useQuery(
    intelligenceQueryOptions<ExecutiveBriefing>({
      queryKey: ["intelligence", "briefing", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/briefing?cycleId=${cycleId}`,
      fallback: DEMO_FALLBACK_BRIEFING,
      staleTime: 90_000,
    })
  );
}

export function useWhatChanged() {
  const cycleId = useCycleId();
  return useQuery(
    intelligenceQueryOptions<{
      periodLabel: string;
      items: Array<{
        metric: string;
        interpretation: string;
        deltaPct: number;
        direction: string;
      }>;
      executiveSummary: string;
    }>({
      queryKey: ["intelligence", "what-changed", cycleId],
      enabled: !!cycleId,
      url: `/api/intelligence/what-changed?cycleId=${cycleId}`,
      fallback: {
        periodLabel: "This week",
        executiveSummary:
          "Operations approval latency increased while Engineering maintained strong completion velocity. Leadership attention recommended on bottleneck clearance.",
        items: [],
      },
      staleTime: 60_000,
    })
  );
}

const DEMO_COPILOT_FALLBACK: CopilotResponse = {
  summary: DEMO_FALLBACK_COPILOT_SUMMARY,
  reasoning: [
    "Organizational pulse at 72/100 (watchlist) — weighted health composite",
    "Operations approval latency is primary negative factor (-12 contribution points)",
    "Revenue Growth alignment remains positive execution signal",
  ],
  metrics: [
    { label: "Organizational Pulse", value: "72/100" },
    { label: "Approval latency", value: "4.2 days" },
    { label: "Blocked initiatives", value: 12 },
    { label: "Forecast confidence", value: "91%" },
  ],
  recommendations: [
    "Authorize expedited approval protocol for Operations critical path",
    "Convene cross-functional sync on Revenue Growth dependencies",
  ],
  affectedDepartments: ["Operations", "Supply Chain"],
  affectedManagers: [],
  urgency: "high",
  confidence: 91,
  factors: [],
};

export async function sendCopilotMessage(
  message: string,
  cycleId?: string,
  options?: { stream?: boolean; onToken?: (chunk: string) => void }
): Promise<{ response: CopilotResponse; cycleName: string }> {
  try {
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
  } catch {
    if (isDemoModeEnabled()) {
      options?.onToken?.(DEMO_FALLBACK_COPILOT_SUMMARY.slice(0, 80));
      return { response: DEMO_COPILOT_FALLBACK, cycleName: "Active cycle (demo continuity)" };
    }
    throw new Error("Strategic advisor temporarily unavailable");
  }
}
