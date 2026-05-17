"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Surfaces when React Query has failed queries — executive-grade recovery */
export function DemoResilienceBanner() {
  const qc = useQueryClient();
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const cache = qc.getQueryCache();
      const errors = cache.getAll().filter((q) => q.state.status === "error").length;
      setFailed(errors);
    }, 2000);
    return () => clearInterval(id);
  }, [qc]);

  if (failed === 0) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <Radio className="h-4 w-4 animate-pulse" aria-hidden />
        Intelligence services reconnecting — operational continuity maintained via demo-safe
        fallbacks. Auto-retry active.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 shrink-0"
        onClick={() => void qc.invalidateQueries()}
      >
        <RefreshCw className="h-3 w-3" />
        Reconnect all
      </Button>
    </div>
  );
}
