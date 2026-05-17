"use client";

import { AlertTriangle, RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExecutiveErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
};

export function ExecutiveErrorState({
  title = "Intelligence services reconnecting",
  message = "Operational analytics are temporarily delayed. Live intelligence will resume automatically — your command view remains active.",
  onRetry,
  compact = false,
  className,
}: ExecutiveErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/80 to-white px-6 text-center",
        compact ? "py-8" : "py-12",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <Radio className="h-5 w-5 animate-pulse text-amber-700" aria-hidden />
      </div>
      <h3 className={cn("mt-4 font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 max-w-md text-muted-foreground leading-relaxed",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {message}
      </p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reconnect now
        </Button>
      )}
      <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Demo-safe mode preserves operational continuity
      </p>
    </div>
  );
}
