"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { HealthGauge, PulseIndicator } from "./HealthGauge";
import { useOrganizationPulse } from "@/hooks/useIntelligence";
import { IntelligenceLoadingState } from "@/components/polish/IntelligenceLoadingState";
import { ExecutiveErrorState } from "@/components/polish/ExecutiveErrorState";
import { cn } from "@/lib/utils";
import type { HealthState } from "@/lib/intelligence/types";

const STATE_BADGE: Record<HealthState, string> = {
  excellent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  healthy: "bg-green-100 text-green-800 border-green-200",
  watchlist: "bg-amber-100 text-amber-800 border-amber-200",
  at_risk: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export function OrganizationPulse() {
  const { data: pulse, isLoading, isError, refetch, isFetching } = useOrganizationPulse();

  if (isLoading && !pulse) {
    return <IntelligenceLoadingState label="Loading organizational pulse…" />;
  }
  if (isError && !pulse) {
    return (
      <ExecutiveErrorState
        compact
        onRetry={() => void refetch()}
        message="Organizational pulse temporarily delayed. Reconnecting to intelligence services…"
      />
    );
  }
  if (!pulse) return null;

  return (
    <FadeIn>
      <Card
        id="organization-pulse"
        className="overflow-hidden border-brand-200/50 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white shadow-xl"
      >
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PulseIndicator active />
              <CardTitle className="text-lg font-semibold text-white">
                Organizational Pulse
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && (
                <span className="text-[10px] text-slate-500 animate-pulse">Syncing…</span>
              )}
              <Badge className={cn("border", STATE_BADGE[pulse.state])}>
                {pulse.stateLabel}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Real-time operational intelligence · {pulse.confidence}% forecast confidence ·
            synced live
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <HealthGauge score={pulse.overallScore} state={pulse.state} label="Pulse" />
            <motion.div className="flex items-center gap-1 text-sm">
              {pulse.trendPct >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-amber-400" />
              )}
              <span className={pulse.trendPct >= 0 ? "text-emerald-400" : "text-amber-400"}>
                {pulse.trendPct > 0 ? "+" : ""}
                {pulse.trendPct} vs prior
              </span>
            </motion.div>
          </div>

          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">{pulse.narrative}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {pulse.factors.slice(0, 6).map((f) => (
                <div
                  key={f.key}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{f.label}</span>
                    <span className="font-semibold tabular-nums">{f.score}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${f.score}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {pulse.departments.slice(0, 4).map((d) => (
                <Badge
                  key={d.id}
                  variant="outline"
                  className="border-white/20 bg-white/5 text-xs text-slate-300"
                >
                  {d.name}: {d.score}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
