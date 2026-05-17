"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function IntelligenceLoadingState({
  label = "Synthesizing operational intelligence…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-4 rounded-xl border border-border/60 bg-muted/20 p-6", className)}
      aria-busy
      aria-live="polite"
      aria-label={label}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground animate-pulse">
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-lg skeleton-shimmer" />
        <Skeleton className="h-20 rounded-lg skeleton-shimmer" />
        <Skeleton className="h-20 rounded-lg skeleton-shimmer" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg skeleton-shimmer" />
    </div>
  );
}
