"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, AlertTriangle, Link2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { healthColor } from "@/lib/alignment/health";
import type { NodeDetailPayload } from "@/lib/alignment/types";
import { Skeleton } from "@/components/ui/skeleton";

export function NodeDetailPanel({
  detail,
  loading,
  onClose,
}: {
  detail: NodeDetailPayload | null;
  loading?: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {(detail || loading) && (
        <motion.aside
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-slate-700/50 bg-slate-950/95 shadow-2xl backdrop-blur-xl sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Operational Intelligence
              </p>
              {detail && <h3 className="font-semibold text-white">{detail.node.label}</h3>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}
            {detail && !loading && (
              <>
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-400" />
                    <h4 className="text-sm font-medium text-slate-300">KPIs</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {detail.kpis.map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-lg border border-slate-800 bg-slate-900/80 p-3"
                      >
                        <p className="text-[10px] text-slate-500">{kpi.label}</p>
                        <p
                          className="text-lg font-semibold tabular-nums"
                          style={{ color: healthColor(detail.node.healthStatus) }}
                        >
                          {kpi.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {detail.escalations.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h4 className="text-sm font-medium text-slate-300">Escalations</h4>
                    </div>
                    <ul className="space-y-2">
                      {detail.escalations.map((e) => (
                        <li
                          key={e.id}
                          className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs"
                        >
                          <p className="font-medium text-amber-200">{e.title}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {e.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {detail.dependencies.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-violet-400" />
                      <h4 className="text-sm font-medium text-slate-300">Dependencies</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {detail.dependencies.map((dep) => (
                        <li
                          key={dep.id}
                          className="flex items-center justify-between rounded border border-slate-800 px-2 py-1.5 text-xs"
                        >
                          <span className="truncate text-slate-300">{dep.title}</span>
                          <Badge variant="secondary" className="shrink-0 text-[9px]">
                            {dep.type.replace(/_/g, " ")}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {detail.insights.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      <h4 className="text-sm font-medium text-slate-300">AI Insights</h4>
                    </div>
                    <ul className="space-y-2">
                      {detail.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {detail.relatedGoals.length > 0 && (
                  <section>
                    <h4 className="mb-2 text-sm font-medium text-slate-300">Related Goals</h4>
                    <ul className="max-h-40 space-y-1.5 overflow-y-auto">
                      {detail.relatedGoals.map((g) => (
                        <li
                          key={g.id}
                          className="flex justify-between rounded border border-slate-800 px-2 py-1.5 text-xs"
                        >
                          <span className="truncate text-slate-400">{g.title}</span>
                          <span className="shrink-0 text-emerald-400">{g.progressPct}%</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
