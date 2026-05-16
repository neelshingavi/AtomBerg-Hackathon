"use client";

import { cn } from "@/lib/utils";

interface WeightageBarProps {
  goals: Array<{ title: string; weightage: number; color?: string }>;
}

export function WeightageBar({ goals }: WeightageBarProps) {
  const total = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  const isComplete = Math.abs(total - 100) < 0.01;
  const isOver = total > 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Weightage distribution</span>
        <span
          data-testid="weightage-total"
          className={cn(
            "text-sm font-bold",
            isComplete ? "text-emerald-600" : isOver ? "text-red-600" : "text-amber-600"
          )}
        >
          {total.toFixed(0)}% / 100%
        </span>
      </div>

      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isComplete ? "bg-emerald-500" : isOver ? "bg-red-500" : "bg-brand-500"
          )}
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: goal.color ?? "#6366f1" }}
            />
            <span className="truncate flex-1">{goal.title || `Goal ${i + 1}`}</span>
            <span className="font-mono font-medium text-foreground">{goal.weightage}%</span>
          </div>
        ))}
      </div>

      {!isComplete && (
        <p className="text-xs text-muted-foreground">
          Remaining: {(100 - total).toFixed(0)}% · Total must equal 100% to submit
        </p>
      )}
    </div>
  );
}
