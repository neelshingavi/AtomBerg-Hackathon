"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
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

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
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
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-brand-600" />
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !data?.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <ul className="divide-y">
              {data.map((log, i) => (
                <li
                  key={log.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                    i === 0 && "bg-brand-50/30"
                  )}
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}{" "}
                      <span className="font-normal text-muted-foreground">
                        {log.entityType}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.createdBy.name}
                      {log.goalSheet?.employee
                        ? ` · ${log.goalSheet.employee.name}`
                        : ""}{" "}
                      · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
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
