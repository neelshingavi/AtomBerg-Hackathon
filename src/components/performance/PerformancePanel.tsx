"use client";

import { useQuery } from "@tanstack/react-query";
import { Gauge, Database, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type HealthData = {
  status: string;
  metrics: {
    healthCheckLatencyMs: number;
    registeredUsers: number;
    avgApiLatencyMs?: number;
    failedJobs24h?: number;
    totalJobs24h?: number;
  };
};

export function PerformancePanel({ compact }: { compact?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      return res.json() as Promise<HealthData>;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className={compact ? "h-16" : "h-32"} />;

  const m = data?.metrics;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          API {m?.healthCheckLatencyMs ?? "—"}ms
        </span>
        {m?.avgApiLatencyMs != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Avg {m.avgApiLatencyMs}ms
          </span>
        )}
        <span
          className={
            data?.status === "healthy" ? "text-emerald-600" : "text-amber-600"
          }
        >
          {data?.status ?? "unknown"}
        </span>
      </div>
    );
  }

  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-brand-600" />
          Performance insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric icon={Clock} label="Health check" value={`${m?.healthCheckLatencyMs ?? 0}ms`} />
          <Metric icon={Database} label="Avg API latency" value={`${m?.avgApiLatencyMs ?? "—"}ms`} />
          <Metric icon={Users} label="Users" value={m?.registeredUsers ?? 0} />
          <Metric
            icon={Gauge}
            label="Failed jobs (24h)"
            value={m?.failedJobs24h ?? 0}
            warn={(m?.failedJobs24h ?? 0) > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className={`text-lg font-bold tabular-nums ${warn ? "text-amber-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
