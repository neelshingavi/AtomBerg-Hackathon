"use client";

import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { getPhaseLabel } from "@/lib/cycle";
import type { CyclePhase } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

const phaseColors: Partial<Record<CyclePhase, string>> = {
  GOAL_SETTING: "border-amber-200/80 bg-amber-50/90 text-amber-900",
  Q1_CHECKIN: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
  Q2_CHECKIN: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
  Q3_CHECKIN: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
  Q4_ANNUAL: "border-blue-200/80 bg-blue-50/90 text-blue-900",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
};

export function Topbar({ title }: { title?: string }) {
  const { data } = useCurrentCycle();
  const cycle = data?.active;
  const phase = cycle?.computedPhase as CyclePhase | undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <FadeIn className="min-w-0 flex-1">
        <Breadcrumbs className="mb-1 hidden sm:flex" />
        {title && (
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
        )}
      </FadeIn>
      <div className="flex items-center gap-2 sm:gap-3">
        <GlobalSearch />
        {cycle && phase && (
          <Badge
            variant="outline"
            className={cn(
              "hidden gap-2 font-normal shadow-sm sm:inline-flex",
              phaseColors[phase]
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {cycle.name} · {getPhaseLabel(phase)}
          </Badge>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}
