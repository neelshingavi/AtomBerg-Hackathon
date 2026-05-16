"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle2, AlertTriangle, Users, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "./RiskBadge";
import type { OperationsFeed } from "@/lib/reports/operations";

const REFETCH_MS = 30_000;

export function OperationalCommandCenter() {
  const { data, isLoading } = useQuery({
    queryKey: ["operations-feed"],
    queryFn: async () => {
      const res = await fetch("/api/reports/operations");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as OperationsFeed;
    },
    refetchInterval: REFETCH_MS,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
            <CardTitle className="text-base">Live operations</CardTitle>
          </div>
          {data?.cycle && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              {data.cycle.name} · {data.cycle.phase.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <StatPill
            icon={Activity}
            label="Pending"
            value={data?.stats.pendingApprovals ?? 0}
          />
          <StatPill
            icon={AlertTriangle}
            label="Escalations"
            value={data?.stats.activeEscalations ?? 0}
          />
          <StatPill icon={Users} label="Active today" value={data?.activeUsersToday ?? 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FeedSection title="Latest approvals" icon={CheckCircle2}>
            {data?.latestApprovals.map((a) => (
              <FeedItem
                key={a.id}
                primary={a.employeeName}
                secondary={`Approved by ${a.managerName}`}
                time={a.approvedAt}
              />
            ))}
            {!data?.latestApprovals.length && (
              <p className="text-xs text-muted-foreground">No recent approvals</p>
            )}
          </FeedSection>

          <FeedSection title="Recent escalations" icon={AlertTriangle}>
            {data?.recentEscalations.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-1.5">
                <FeedItem
                  primary={e.employeeName}
                  secondary={e.trigger.replace(/_/g, " ")}
                  time={e.createdAt}
                />
                <RiskBadge level={e.severity as "low" | "medium" | "critical"} />
              </div>
            ))}
          </FeedSection>
        </div>

        {data?.overdueManagers && data.overdueManagers.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <p className="text-xs font-semibold text-amber-800">Overdue managers</p>
            <ul className="mt-2 space-y-1">
              {data.overdueManagers.map((m) => (
                <li key={m.id} className="flex justify-between text-xs">
                  <span>{m.name}</span>
                  <span className="text-amber-700">
                    {m.pendingCount} pending · {m.oldestDays}d
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function FeedSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FeedItem({
  primary,
  secondary,
  time,
}: {
  primary: string;
  secondary: string;
  time: string;
}) {
  return (
    <div className="py-1.5">
      <p className="text-sm font-medium">{primary}</p>
      <p className="text-xs text-muted-foreground">
        {secondary} · {formatDistanceToNow(new Date(time), { addSuffix: true })}
      </p>
    </div>
  );
}
