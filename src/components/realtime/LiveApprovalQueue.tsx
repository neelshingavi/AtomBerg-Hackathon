"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LivePulseIndicator } from "./LivePulseIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import type { OperationsFeed } from "@/lib/reports/operations";

export function LiveApprovalQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ["operations-feed"],
    queryFn: async () => {
      const res = await fetch("/api/reports/operations");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as OperationsFeed;
    },
    refetchInterval: 8_000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card data-live-approval-queue>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CheckSquare className="h-4 w-4" />
          Live approval velocity
        </CardTitle>
        <LivePulseIndicator />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold">{data?.stats.pendingApprovals ?? 0}</p>
            <p className="text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2">
            <p className="text-lg font-bold">{data?.overdueManagers?.length ?? 0}</p>
            <p className="text-muted-foreground">Bottlenecks</p>
          </div>
        </div>
        {data?.overdueManagers?.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs"
          >
            <span className="font-medium">{m.name}</span>
            <span className="flex items-center gap-1 text-amber-800">
              <Clock className="h-3 w-3" />
              {m.pendingCount} · {m.oldestDays}d
            </span>
          </div>
        ))}
        {data?.latestApprovals?.[0] && (
          <p className="text-[10px] text-muted-foreground">
            Last approval {formatDistanceToNow(new Date(data.latestApprovals[0].approvedAt), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
