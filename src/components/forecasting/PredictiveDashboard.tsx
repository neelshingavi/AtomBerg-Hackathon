"use client";

import { useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { usePredictiveForecast } from "@/hooks/usePredictive";
import { sendCopilotMessage } from "@/hooks/useIntelligence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ForecastHorizon } from "@/lib/predictive-engine/types";
import { RiskRadarChart } from "./RiskRadarChart";
import { EarlyWarningPanel } from "./EarlyWarningPanel";
import { MomentumPanel } from "./MomentumPanel";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { PredictiveRiskList } from "./PredictiveRiskList";
import { RiskHeatmap } from "./RiskHeatmap";
import { InterventionPanel } from "./InterventionPanel";
import { TimelineForecastReplay } from "./TimelineForecastReplay";
import { ForecastTrajectoryChart } from "./ForecastTrajectoryChart";
import { InitiativeForecastPanel } from "./InitiativeForecastPanel";
import { StabilityPanel } from "./StabilityPanel";
import { BottleneckPanel } from "./BottleneckPanel";

const HORIZONS: { id: ForecastHorizon; label: string }[] = [
  { id: "30d", label: "30 days" },
  { id: "quarter", label: "Quarter" },
  { id: "cycle", label: "Full cycle" },
];

const FORECAST_PROMPTS = [
  "What is most likely to fail next quarter?",
  "Which teams require proactive intervention?",
  "Predict next cycle bottlenecks",
  "What managers are becoming overloaded?",
];

export function PredictiveDashboard() {
  const [horizon, setHorizon] = useState<ForecastHorizon>("quarter");
  const { data, isLoading } = usePredictiveForecast(horizon);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askPredictiveAi() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await sendCopilotMessage(aiQuery);
      setAiResponse(res.response.summary);
    } catch {
      setAiResponse("Unable to generate predictive insight.");
    } finally {
      setAiLoading(false);
    }
  }

  if (isLoading || !data) {
    return <Skeleton className="h-[800px] w-full rounded-xl" />;
  }

  const completionTraj = data.trajectories.find((t) => t.metric === "completion");
  const healthTraj = data.trajectories.find((t) => t.metric === "health");

  return (
    <FadeIn className="space-y-8" data-predictive-dashboard>
      <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-transparent to-indigo-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-500" />
              <Badge variant="secondary" className="animate-pulse">
                Predictive intelligence
              </Badge>
              <Badge variant="outline" className="capitalize">
                Outlook: {data.overallRiskOutlook}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {data.executiveNarrative}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border bg-card p-1">
            {HORIZONS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHorizon(h.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  horizon === h.id
                    ? "bg-brand-600 text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskRadarChart items={data.riskRadar} />
        </div>
        <EarlyWarningPanel warnings={data.earlyWarnings} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MomentumPanel momentum={data.momentum} />
        <StabilityPanel stability={data.stability} />
        <BottleneckPanel bottlenecks={data.bottlenecks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {completionTraj && <ForecastTrajectoryChart trajectory={completionTraj} />}
        {healthTraj && <ForecastTrajectoryChart trajectory={healthTraj} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PredictiveRiskList predictions={data.predictions} />
        <ScenarioSimulator />
      </div>

      <RiskHeatmap cells={data.heatmap} />

      <div className="grid gap-6 lg:grid-cols-2">
        <InitiativeForecastPanel initiatives={data.initiatives} />
        <InterventionPanel interventions={data.interventions} />
      </div>

      <TimelineForecastReplay timeline={data.timelineReplay} />

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold">Predictive AI Insights</h3>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {FORECAST_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAiQuery(p)}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-violet-400"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about future risks, bottlenecks, forecasts…"
            onKeyDown={(e) => e.key === "Enter" && void askPredictiveAi()}
          />
          <Button onClick={() => void askPredictiveAi()} disabled={aiLoading}>
            {aiLoading ? "Analyzing…" : "Ask"}
          </Button>
        </div>
        {aiResponse && (
          <p className="mt-3 rounded-lg bg-violet-500/5 p-3 text-sm text-muted-foreground">
            {aiResponse}
          </p>
        )}
      </div>
    </FadeIn>
  );
}
