"use client";

import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { getPhaseLabel } from "@/lib/cycle";
import type { CyclePhase } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar({ title }: { title?: string }) {
  const { data } = useCurrentCycle();
  const cycle = data?.active;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div>
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        {cycle && (
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {cycle.name} · {getPhaseLabel(cycle.computedPhase as CyclePhase)}
          </Badge>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}
