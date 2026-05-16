"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Created",
  UPDATED: "Updated",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Returned for rework",
  UNLOCKED: "Unlocked",
  LOCKED: "Locked",
  ACHIEVEMENT_LOGGED: "Achievement logged",
  CHECKIN_ADDED: "Check-in feedback",
  SHARED_GOAL_PUSHED: "Shared goal assigned",
  WEIGHTAGE_UPDATED: "Weightage updated",
};

const ACTION_CHIP: Record<string, string> = {
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  SUBMITTED: "bg-info/10 text-info border-info/20",
  ACHIEVEMENT_LOGGED: "bg-brand-500/10 text-brand-700 border-brand-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ActivityFeed({
  limit = 5,
  enhanced = false,
  title = "Activity timeline",
}: {
  limit?: number;
  enhanced?: boolean;
  title?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-feed", limit],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?limit=${limit}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.logs as Array<{
        id: string;
        action: string;
        entityType: string;
        createdAt: string;
        createdBy: { name: string };
        goalSheet?: { employee: { name: string } } | null;
      }>;
    },
  });

  return (
    <FadeIn>
      <Card className={cn("enterprise-card overflow-hidden", enhanced && "h-full")}>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="type-card flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full skeleton-shimmer" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4 skeleton-shimmer" />
                    <Skeleton className="h-2 w-1/2 skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.length ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : enhanced ? (
            <ul className="relative divide-y before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-border">
              {data.map((log) => (
                <li key={log.id} className="relative flex gap-3 px-4 py-3 hover:bg-muted/30">
                  <Avatar className="z-10 h-8 w-8 shrink-0 border-2 border-card">
                    <AvatarFallback className="text-[10px] bg-brand-500/10 text-brand-700">
                      {initials(log.createdBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{log.createdBy.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-normal",
                          ACTION_CHIP[log.action] ?? "border-border"
                        )}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.entityType}
                      {log.goalSheet?.employee ? ` · ${log.goalSheet.employee.name}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y">
              {data.map((log, i) => (
                <li
                  key={log.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                    i === 0 && "bg-brand-50/20"
                  )}
                >
                  <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}{" "}
                      <span className="font-normal text-muted-foreground">{log.entityType}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.createdBy.name}
                      {log.goalSheet?.employee ? ` · ${log.goalSheet.employee.name}` : ""} ·{" "}
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
