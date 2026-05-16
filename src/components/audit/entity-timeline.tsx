"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AuditDiffViewer } from "@/components/audit/audit-diff-viewer";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Created",
  UPDATED: "Updated",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Returned",
  UNLOCKED: "Unlocked",
  LOCKED: "Locked",
  ACHIEVEMENT_LOGGED: "Achievement logged",
  CHECKIN_ADDED: "Check-in",
  SHARED_GOAL_PUSHED: "Shared goal pushed",
};

type TimelineLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdBy: { name: string };
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function EntityTimeline({
  goalSheetId,
  entityType,
  entityId,
  limit = 20,
  className,
}: {
  goalSheetId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  className?: string;
}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (goalSheetId) params.set("goalSheetId", goalSheetId);
  if (entityType) params.set("entityType", entityType);
  if (entityId) params.set("entityId", entityId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["entity-timeline", goalSheetId, entityType, entityId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.logs as TimelineLog[];
    },
    enabled: !!(goalSheetId || (entityType && entityId)),
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className={cn("text-sm text-muted-foreground text-center py-6", className)}>
        Failed to load timeline.{" "}
        <button type="button" className="underline" onClick={() => void refetch()}>
          Retry
        </button>
      </p>
    );
  }

  if (!data?.length) {
    return (
      <p className={cn("text-sm text-muted-foreground text-center py-8", className)}>
        <History className="mx-auto mb-2 h-8 w-8 opacity-30" />
        No history for this entity yet.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "relative space-y-0 divide-y before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-border",
        className
      )}
    >
      {data.map((log) => (
        <li key={log.id} className="relative flex gap-3 py-4 first:pt-0">
          <Avatar className="z-10 h-9 w-9 shrink-0 border-2 border-card">
            <AvatarFallback className="text-[10px] bg-brand-500/10 text-brand-700">
              {initials(log.createdBy.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{log.createdBy.name}</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                {ACTION_LABELS[log.action] ?? log.action}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {log.entityType} · {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
            </p>
            {(log.previousValues || log.newValues) && (
              <AuditDiffViewer
                previousValues={log.previousValues}
                newValues={log.newValues}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
