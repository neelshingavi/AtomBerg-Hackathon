"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionCard } from "@/components/motion";

const accentStyles = {
  default: "from-brand-500/20 to-brand-500/5 text-brand-600",
  success: "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
  warning: "from-amber-500/20 to-amber-500/5 text-amber-600",
  info: "from-cyan-500/20 to-cyan-500/5 text-cyan-600",
  neutral: "from-slate-500/15 to-slate-500/5 text-slate-600",
} as const;

const trendStyles = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
  trend,
  trendLabel,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  accent?: keyof typeof accentStyles;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  className?: string;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : trend ? Minus : null;

  return (
    <MotionCard
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover sm:p-5",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500/80 via-cyan-400/60 to-transparent" />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="type-label">{label}</p>
          <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {value}
          </p>
          {(hint || (trend && trendLabel)) && (
            <div className="flex flex-wrap items-center gap-2">
              {hint && <p className="type-caption">{hint}</p>}
              {trend && TrendIcon && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium",
                    trendStyles[trend]
                  )}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden />
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-11 sm:w-11",
              accentStyles[accent]
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </div>
    </MotionCard>
  );
}
