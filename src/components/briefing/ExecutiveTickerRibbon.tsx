"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { TickerMetric } from "@/lib/boardroom/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  pulse: Gauge,
  escalations: AlertTriangle,
  approvals: Activity,
  completion: Target,
  risks: AlertTriangle,
  alignment: Zap,
  momentum: TrendingUp,
};

export function ExecutiveTickerRibbon({ metrics }: { metrics: TickerMetric[] }) {
  const doubled = [...metrics, ...metrics];

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 py-2.5 backdrop-blur-md"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-950 to-transparent" />
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: [0, -120 * metrics.length] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((m, i) => {
          const Icon = ICONS[m.key] ?? Activity;
          return (
            <div key={`${m.key}-${i}`} className="flex items-center gap-2 px-2 text-sm">
              <Icon className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-slate-400">{m.label}</span>
              <span className="font-semibold tabular-nums text-white">{m.value}</span>
              {m.delta && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    m.trend === "up" && m.key !== "escalations" && m.key !== "risks"
                      ? "text-emerald-400"
                      : m.trend === "up"
                        ? "text-red-400"
                        : m.trend === "down"
                          ? "text-emerald-400"
                          : "text-slate-500"
                  )}
                >
                  {m.trend === "up" ? (
                    <TrendingUp className="inline h-3 w-3" />
                  ) : m.trend === "down" ? (
                    <TrendingDown className="inline h-3 w-3" />
                  ) : null}{" "}
                  {m.delta}
                </span>
              )}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
