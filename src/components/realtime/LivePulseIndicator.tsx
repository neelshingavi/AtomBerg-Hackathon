"use client";

import { cn } from "@/lib/utils";

export function LivePulseIndicator({
  active = true,
  label = "Live",
  className,
}: {
  active?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-muted bg-muted text-muted-foreground",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {active && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            active ? "bg-emerald-500" : "bg-muted-foreground"
          )}
        />
      </span>
      {label}
    </span>
  );
}
