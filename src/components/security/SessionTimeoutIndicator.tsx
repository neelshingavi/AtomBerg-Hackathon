"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const WARN_BEFORE_MS = 30 * 60 * 1000;

export function SessionTimeoutIndicator({ className }: { className?: string }) {
  const { data: session } = useSession();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    const loginTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - loginTime;
      const left = SESSION_MAX_MS - elapsed;
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [session]);

  if (remaining == null || remaining > WARN_BEFORE_MS) return null;

  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const urgent = remaining < 10 * 60_000;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
        urgent
          ? "bg-amber-50 text-amber-800 border border-amber-200"
          : "bg-muted text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Clock className="h-3 w-3" aria-hidden />
      <span>
        Session expires in {hours > 0 ? `${hours}h ` : ""}
        {mins}m
      </span>
    </div>
  );
}
