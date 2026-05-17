"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, Mail, Clock } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { PerformancePanel } from "@/components/performance/PerformancePanel";

type Summary = {
  periodHours: number;
  totalRuns: number;
  failedRuns: number;
  avgLatencyMs: number;
  recentEmailJobs: Array<{ jobType: string; status: string; createdAt: string; durationMs: number | null }>;
  recentCronJobs: Array<{ jobType: string; status: string; createdAt: string; durationMs: number | null; error: string | null }>;
};

export default function ObservabilityPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["observability"],
    queryFn: async () => {
      const res = await fetch("/api/observability");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Summary;
    },
    refetchInterval: 30_000,
  });

  return (
    <>
      <Topbar title="System observability" />
      <PageContainer>
        <PageHeader
          title="Operational telemetry"
          description="API latency, cron health, email delivery, and job failures (last 24h)."
          actions={
            <button
              type="button"
              className="text-sm text-brand-600 hover:underline"
              onClick={() => void refetch()}
            >
              Refresh
            </button>
          }
        />

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard icon={Activity} label="Total job runs" value={data?.totalRuns ?? 0} />
              <StatCard icon={AlertCircle} label="Failed runs" value={data?.failedRuns ?? 0} danger />
              <StatCard icon={Clock} label="Avg latency" value={`${data?.avgLatencyMs ?? 0}ms`} />
              <StatCard icon={Mail} label="Period" value={`${data?.periodHours ?? 24}h`} />
            </div>

            <PerformancePanel />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <JobList title="Cron jobs" jobs={data?.recentCronJobs ?? []} />
              <JobList title="Email delivery" jobs={data?.recentEmailJobs ?? []} />
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <Card className="enterprise-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg p-2 ${danger ? "bg-destructive/10" : "bg-brand-500/10"}`}>
          <Icon className={`h-5 w-5 ${danger ? "text-destructive" : "text-brand-600"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type JobRow = {
  jobType: string;
  status: string;
  createdAt: string;
  durationMs: number | null;
  error?: string | null;
};

function JobList({ title, jobs }: { title: string; jobs: JobRow[] }) {
  return (
    <Card className="enterprise-card">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!jobs.length ? (
          <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm border-b pb-2 last:border-0">
                <span className="font-mono text-xs truncate">{j.jobType}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={j.status === "failed" ? "destructive" : "outline"}>{j.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(j.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
