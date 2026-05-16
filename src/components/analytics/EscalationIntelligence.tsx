"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "./RiskBadge";
import { EscalationTimeline } from "./EscalationTimeline";
import { CHART_COLORS, chartTooltipStyle } from "./chart-theme";
import type { EscalationAnalytics } from "@/lib/reports/escalation-analytics";

const SEVERITY_COLORS = { low: "#10b981", medium: "#f59e0b", critical: "#ef4444" };

export function EscalationIntelligence({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["escalation-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/reports/escalation-analytics");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as EscalationAnalytics;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Unresolved" value={data?.unresolvedCount ?? 0} />
        <MetricCard
          label="Avg resolution"
          value={`${data?.avgResolutionDays ?? 0}d`}
        />
        <MetricCard
          label="Manager SLA"
          value={`${data?.managerSlaCompliance ?? 0}%`}
        />
      </div>

      {!compact && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escalation trends</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trends ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip {...chartTooltipStyle} />
                  <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.severityDistribution ?? []}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    label={({ severity, count }) => `${severity}: ${count}`}
                  >
                    {(data?.severityDistribution ?? []).map((entry) => (
                      <Cell
                        key={entry.severity}
                        fill={SEVERITY_COLORS[entry.severity]}
                      />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By department</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.byDepartment?.slice(0, 6) ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="department" width={90} tick={{ fontSize: 10 }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              <Bar dataKey="unresolved" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {!compact && data?.recentEscalations[0] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escalation lifecycle</CardTitle>
            <p className="text-xs text-muted-foreground">
              {data.recentEscalations[0].employeeName} · {data.recentEscalations[0].daysOpen}d open
            </p>
          </CardHeader>
          <CardContent>
            <EscalationTimeline events={data.recentEscalations[0].timeline} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent escalations</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {data?.recentEscalations.slice(0, compact ? 5 : 8).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2.5 first:pt-0">
              <div>
                <p className="text-sm font-medium">{e.employeeName}</p>
                <p className="text-xs text-muted-foreground">
                  {e.department} · {e.trigger.replace(/_/g, " ")} · {e.daysOpen}d open
                </p>
              </div>
              <div className="flex items-center gap-2">
                {e.daysOverdue > 0 && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                    +{e.daysOverdue}d overdue
                  </span>
                )}
                <RiskBadge level={e.severity} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 text-center shadow-card">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
