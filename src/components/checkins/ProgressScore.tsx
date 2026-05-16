"use client";

import { calculateProgress, type ProgressInput } from "@/lib/calculations/progress";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ProgressScore({
  input,
  className,
}: {
  input: ProgressInput;
  className?: string;
}) {
  const result = calculateProgress(input);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress score</span>
        <span
          className={cn(
            "font-semibold",
            result.isOverachieved ? "text-emerald-600" : "text-foreground"
          )}
        >
          {result.displayScore}
        </span>
      </div>
      {input.uomType !== "ZERO_BASED" && input.uomType !== "TIMELINE" && (
        <Progress value={Math.min(result.percentage, 150)} className="h-2" />
      )}
    </div>
  );
}
