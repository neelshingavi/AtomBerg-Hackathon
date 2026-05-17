"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PRESET_SCENARIOS } from "@/lib/predictive-engine";
import { useScenarioSimulation } from "@/hooks/usePredictive";
import type { ScenarioResult } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

export function ScenarioSimulator() {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const simulation = useScenarioSimulation();

  function runPreset(input: (typeof PRESET_SCENARIOS)[0]["input"]) {
    simulation.mutate(input, { onSuccess: setResult });
  }

  return (
    <Card className="enterprise-card overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="h-4 w-4 text-indigo-500" />
          What-If Scenario Simulator
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Model future operational conditions and projected organizational impact
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={simulation.isPending}
              onClick={() => runPreset(preset.input)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {simulation.isPending && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground"
            >
              Running simulation…
            </motion.p>
          )}
          {result && !simulation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 rounded-xl border bg-card/80 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                {result.scenarioLabel}
              </p>
              <p className="text-sm text-muted-foreground">{result.narrative}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <ImpactBlock title="Baseline" data={result.baseline} />
                <ImpactBlock title="Projected" data={result.projected} highlight />
              </div>

              <div className="space-y-1.5">
                {result.deltas.map((d) => (
                  <div
                    key={d.metric}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                  >
                    <span>{d.metric}</span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        d.change > 0 && d.metric.includes("Escalation") && "text-red-500",
                        d.change > 0 && !d.metric.includes("Escalation") && "text-emerald-600",
                        d.change < 0 && "text-red-500"
                      )}
                    >
                      {d.change > 0 ? "+" : ""}
                      {d.change} {d.unit}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                Confidence: {result.confidence}% · Heuristic projection from live operational data
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function ImpactBlock({
  title,
  data,
  highlight,
}: {
  title: string;
  data: ScenarioResult["baseline"];
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight && "border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30"
      )}
    >
      <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Health" value={data.healthScore} />
        <Stat label="Completion" value={`${data.completionPct}%`} />
        <Stat label="Escalations" value={data.escalationCount} />
        <Stat label="Alignment" value={`${data.alignmentScore}%`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
