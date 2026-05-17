"use client";

import { AlertCircle, Lightbulb, Zap } from "lucide-react";
import type { AlignmentScores } from "@/lib/alignment/types";
import { cn } from "@/lib/utils";

export function AlignmentInsightsPanel({
  scores,
  className,
}: {
  scores: AlignmentScores;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { label: "Strategic Linkage", value: scores.strategicLinkage },
          { label: "Collaboration", value: scores.crossFunctionalCollaboration },
          { label: "Dependency Health", value: scores.dependencyHealth },
          { label: "Orphan Goals", value: scores.orphanGoalRate, invert: true },
          { label: "Silo Index", value: scores.siloIndex, invert: true },
          { label: "Coverage", value: scores.contributionCoverage },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
          >
            <p className="text-[10px] text-slate-500">{m.label}</p>
            <p
              className={cn(
                "text-lg font-semibold tabular-nums",
                (m.invert ? m.value > 30 : m.value < 50)
                  ? "text-amber-400"
                  : "text-emerald-400"
              )}
            >
              {m.value}%
            </p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          <h4 className="text-sm font-medium text-slate-300">Executive Insights</h4>
        </div>
        <ul className="space-y-2">
          {scores.insights.map((insight, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-xs text-slate-300"
            >
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {scores.bottlenecks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-medium text-slate-300">Execution Bottlenecks</h4>
          </div>
          <ul className="space-y-2">
            {scores.bottlenecks.slice(0, 5).map((bn) => (
              <li
                key={bn.id}
                className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs"
              >
                <AlertCircle
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    bn.severity === "high" ? "text-red-400" : "text-amber-400"
                  )}
                />
                <div>
                  <p className="font-medium text-amber-100">{bn.title}</p>
                  <p className="text-slate-500">{bn.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
