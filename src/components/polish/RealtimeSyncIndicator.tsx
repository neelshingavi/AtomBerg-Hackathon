"use client";

import { Radio } from "lucide-react";
import { useRealtimeStatus } from "@/components/providers/RealtimeProvider";
import { cn } from "@/lib/utils";

export function RealtimeSyncIndicator({ className }: { className?: string }) {
  const { connected, reconnecting } = useRealtimeStatus();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : reconnecting
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-slate-50 text-slate-600",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Radio
        className={cn("h-3 w-3", connected && "text-emerald-500", reconnecting && "animate-pulse")}
        aria-hidden
      />
      {connected ? "Live sync" : reconnecting ? "Reconnecting…" : "Polling fallback"}
    </span>
  );
}
