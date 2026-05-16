"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionCard } from "@/components/motion";

const accentStyles = {
  default: "from-brand-500/20 to-brand-500/5 text-brand-600",
  success: "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
  warning: "from-amber-500/20 to-amber-500/5 text-amber-600",
  info: "from-cyan-500/20 to-cyan-500/5 text-cyan-600",
  neutral: "from-slate-500/15 to-slate-500/5 text-slate-600",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  accent?: keyof typeof accentStyles;
  className?: string;
}) {
  return (
    <MotionCard
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-400 to-brand-600 opacity-80" />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
              accentStyles[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </MotionCard>
  );
}
