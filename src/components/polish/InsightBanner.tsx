"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightBanner({
  headline,
  impact,
  action,
  urgency = "medium",
  className,
}: {
  headline: string;
  impact?: string;
  action?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  className?: string;
}) {
  const styles = {
    low: "border-slate-200 bg-slate-50/80",
    medium: "border-brand-200/60 bg-brand-50/50",
    high: "border-amber-300/50 bg-amber-50/60",
    critical: "border-red-300/50 bg-red-50/60",
  };

  return (
    <div
      className={cn("rounded-xl border px-4 py-3", styles[urgency], className)}
      role="note"
    >
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-snug">{headline}</p>
          {impact && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Why it matters: </span>
              {impact}
            </p>
          )}
          {action && (
            <p className="text-xs font-medium text-brand-700">
              Leadership action → {action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
