"use client";

import { CycleStatusBanner } from "@/components/dashboard/CycleStatusBanner";
import { QuarterlyProgressCard } from "@/components/dashboard/QuarterlyProgressCard";

export function EmployeeDashboardClient({
  goalSheetId,
  goalsCount,
  achievementsByQuarter,
  goals,
  openQuarter,
}: {
  goalSheetId?: string;
  goalsCount?: number;
  achievementsByQuarter?: Record<string, number>;
  goals: Array<{
    weightage: number;
    achievements: Array<{ quarter: string; progressScore: number | null }>;
  }>;
  openQuarter?: string | null;
}) {
  return (
  <>
      <CycleStatusBanner
        goalSheetId={goalSheetId}
        goalsCount={goalsCount}
        achievementsByQuarter={achievementsByQuarter}
      />
      {goals.length > 0 && (
        <div className="mb-8 max-w-md">
          <QuarterlyProgressCard goals={goals} openQuarter={openQuarter} />
        </div>
      )}
    </>
  );
}
