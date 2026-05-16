"use client";

import { calculateSheetScore } from "@/lib/calculations/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export function QuarterlyProgressCard({
  goals,
  openQuarter,
}: {
  goals: Array<{
    weightage: number;
    achievements: Array<{ quarter: string; progressScore: number | null }>;
  }>;
  openQuarter?: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Quarterly progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {QUARTERS.map((q) => {
          const score = calculateSheetScore(goals, q);
          const pct = Math.round(score * 100);
          const hasData = goals.some((g) =>
            g.achievements.some((a) => a.quarter === q && a.progressScore != null)
          );
          return (
            <div key={q} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span
                  className={cn(
                    "font-medium",
                    openQuarter === q && "text-emerald-600"
                  )}
                >
                  {q}
                  {openQuarter === q && " · open"}
                </span>
                <span className="text-muted-foreground">
                  {hasData ? `${pct}%` : "—"}
                </span>
              </div>
              <Progress value={hasData ? Math.min(pct, 100) : 0} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
