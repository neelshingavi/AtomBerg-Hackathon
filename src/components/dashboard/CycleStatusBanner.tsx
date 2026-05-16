"use client";

import Link from "next/link";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { getActiveQuarter, getPhaseLabel } from "@/lib/cycle";
import type { CyclePhase, GoalCycle } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "lucide-react";

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
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <Calendar className="h-4 w-4" />
        <AlertTitle>Goal setting open</AlertTitle>
        <AlertDescription>
          {getPhaseLabel(phase)} for {cycle.name} — submit your goals before the window closes.
        </AlertDescription>
      </Alert>
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
      <Alert className="mb-6 border-emerald-200 bg-emerald-50">
        <Calendar className="h-4 w-4 text-emerald-700" />
        <AlertTitle className="text-emerald-900">
          {activeQuarter} check-in window open
        </AlertTitle>
        <AlertDescription className="text-emerald-800">
          Please update your achievement for {activeQuarter}.{" "}
          {remaining > 0
            ? `${remaining} goal${remaining === 1 ? "" : "s"} remaining.`
            : "All goals updated."}{" "}
          <Link
            href={`/employee/goals/${goalSheetId}/checkin`}
            className="font-medium underline underline-offset-2"
          >
            Go to check-ins →
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
