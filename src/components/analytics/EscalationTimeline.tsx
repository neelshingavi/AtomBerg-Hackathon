"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/risk/escalation-utils";
import { format } from "date-fns";

export function EscalationTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-0 border-l border-border pl-4">
      {events.map((event) => (
        <li key={event.id} className="pb-4 last:pb-0">
          <span
            className={cn(
              "absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 bg-card",
              event.status === "completed"
                ? "border-emerald-500 text-emerald-500"
                : event.status === "active"
                  ? "border-amber-500 text-amber-500"
                  : "border-muted text-muted-foreground"
            )}
          >
            {event.status === "completed" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : event.status === "active" ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Circle className="h-2 w-2" />
            )}
          </span>
          <p className="text-sm font-medium">{event.label}</p>
          {event.timestamp && (
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(event.timestamp), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
