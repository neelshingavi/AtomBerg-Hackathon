"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { getActiveQuarter, getPhaseLabel } from "@/lib/cycle";
import type { CyclePhase, GoalCycle } from "@prisma/client";
import { Calendar, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CycleStatusBanner({
  goalSheetId,
  goalsCount,
  achievementsByQuarter,
}: {
  goalSheetId?: string;
  goalsCount?: number;
  achievementsByQuarter?: Record<string, number>;
}) {
  const { data } = useCurrentCycle();
  const cycle = data?.active;

  if (!cycle) return null;

  const phase = cycle.computedPhase as CyclePhase;

  if (phase === "GOAL_SETTING") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 p-4 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">Goal setting is open</p>
            <p className="mt-1 text-sm text-amber-800/90">
              {getPhaseLabel(phase)} for {cycle.name} — submit your goals before the window
              closes.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const activeQuarter = getActiveQuarter(cycle as unknown as GoalCycle);

  if (
    activeQuarter &&
    goalSheetId &&
    goalsCount &&
    cycle.quarterWindows?.[activeQuarter as keyof typeof cycle.quarterWindows]
  ) {
    const logged = achievementsByQuarter?.[activeQuarter] ?? 0;
    const remaining = Math.max(0, goalsCount - logged);

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">
                {activeQuarter} check-in window is open
              </p>
              <p className="mt-1 text-sm text-emerald-800/90">
                {remaining > 0
                  ? `${remaining} goal${remaining === 1 ? "" : "s"} still need updates.`
                  : "All goals updated for this quarter."}
              </p>
            </div>
          </div>
          <Link
            href={`/employee/goals/${goalSheetId}/checkin`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white",
              "shadow-sm transition-colors hover:bg-emerald-700"
            )}
          >
            Go to check-ins
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  return null;
}
