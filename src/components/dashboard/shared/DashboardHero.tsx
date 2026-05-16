"use client";

import { FadeIn } from "@/components/motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DashboardHero({
  greeting,
  subtitle,
  cycleName,
  completionPct,
  quarterlyLabel,
  quarterlyPct,
  variant = "employee",
  className,
}: {
  greeting: string;
  subtitle?: string;
  cycleName?: string;
  completionPct?: number;
  quarterlyLabel?: string;
  quarterlyPct?: number;
  variant?: "employee" | "manager" | "admin";
  className?: string;
}) {
  const gradients = {
    employee: "from-brand-600/10 via-cyan-500/5 to-transparent border-brand-200/60",
    manager: "from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/60",
    admin: "from-violet-600/10 via-indigo-500/5 to-transparent border-violet-200/60",
  };

  return (
    <FadeIn>
      <section
        className={cn(
          "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 shadow-card sm:p-8",
          gradients[variant],
          className
        )}
      >
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="type-label">Performance overview</p>
            <h2 className="type-hero">{greeting}</h2>
            {subtitle && <p className="type-body max-w-xl text-muted-foreground">{subtitle}</p>}
            {cycleName && (
              <Badge variant="outline" className="mt-2 font-normal">
                {cycleName}
              </Badge>
            )}
          </div>
          {(completionPct !== undefined || quarterlyPct !== undefined) && (
            <div className="flex flex-wrap gap-6 sm:gap-10">
              {completionPct !== undefined && (
                <div className="min-w-[140px] space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="type-label">Cycle completion</span>
                    <span className="text-lg font-semibold tabular-nums">{completionPct}%</span>
                  </div>
                  <Progress value={completionPct} className="h-2" />
                </div>
              )}
              {quarterlyPct !== undefined && quarterlyLabel && (
                <div className="min-w-[140px] space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="type-label">{quarterlyLabel}</span>
                    <span className="text-lg font-semibold tabular-nums">{quarterlyPct}%</span>
                  </div>
                  <Progress value={quarterlyPct} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </FadeIn>
  );
}
