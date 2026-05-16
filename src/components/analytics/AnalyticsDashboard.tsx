"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { FadeInView } from "@/components/motion";
import { exportToCsv } from "@/lib/export-table";
import { AnalyticsFilters, type AnalyticsFilterValues } from "./AnalyticsFilters";
import { CHART_COLORS, chartTooltipStyle, gradientDefs } from "./chart-theme";

type AnalyticsData = {
  cycle: { id: string; name: string; fiscalYear: string } | null;
  qoqTrend: Array<{
    department: string;
    quarter: string;
    avgScore: number;
    employeeCount: number;
  }>;
  departmentHeatmap: Array<{
    department: string;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  }>;
  thrustAreaBreakdown: Array<{
    id: string;
    name: string;
    color: string;
    goalCount: number;
    avgWeightage: number;
    avgProgressPct: number;
  }>;
  managerEffectiveness: Array<{
    managerId: string;
    manager: string;
    totalReports: number;
    sheetsApproved: number;
    checkinsCompleted: number;
    approvalRate: number;
    avgApprovalDays: number;
    escalationCount: number;
    teamCompletionPct: number;
    rank: number;
  }>;
  completionFunnel?: Array<{ stage: string; count: number; pct: number }>;
  statusDistribution?: Array<{ label: string; count: number }>;
  uomDistribution?: Array<{ label: string; count: number }>;
  departmentComparison?: Array<{
    department: string;
    productivity: number;
    delays: number;
    compliance: number;
    completion: number;
  }>;
  orgTrends?: Array<{
    quarter: string;
    completionPct: number;
    achievementPct: number;
    delays: number;
    escalations: number;
  }>;
};

type ManagerEffectivenessRow = AnalyticsData["managerEffectiveness"][number];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const REFETCH_MS = 60_000;

export function AnalyticsDashboard({ scope }: { scope: "admin" | "manager" }) {
  const [filters, setFilters] = useState<AnalyticsFilterValues>({ cycleId: "" });

  const handleFilters = useCallback((f: AnalyticsFilterValues) => {
    setFilters(f);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", filters.cycleId, filters.departmentId, scope],
    enabled: !!filters.cycleId,
    queryFn: async () => {
      const params = new URLSearchParams({ cycleId: filters.cycleId });
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      const res = await fetch(`/api/reports/analytics?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AnalyticsData;
    },
    refetchInterval: REFETCH_MS,
  });

  const lineData = useMemo(() => {
    if (!data?.qoqTrend.length) return [];
    const departments = Array.from(new Set(data.qoqTrend.map((d) => d.department))).slice(0, 6);
    return QUARTERS.map((quarter) => {
      const row: Record<string, string | number> = { quarter };
      for (const dept of departments) {
        const pt = data.qoqTrend.find((d) => d.department === dept && d.quarter === quarter);
        row[dept] = pt?.avgScore ?? 0;
      }
      return row;
    });
  }, [data?.qoqTrend]);

  const managerEffectivenessColumns = useMemo<ColumnDef<ManagerEffectivenessRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: ({ column }) => <DataTableSortHeader column={column} title="#" />,
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">{row.original.rank}</span>
        ),
      },
      {
        accessorKey: "manager",
        header: ({ column }) => <DataTableSortHeader column={column} title="Manager" />,
        cell: ({ row }) => <span className="font-medium">{row.original.manager}</span>,
      },
      {
        accessorKey: "totalReports",
        header: ({ column }) => <DataTableSortHeader column={column} title="Reports" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.totalReports}</span>,
      },
      {
        accessorKey: "sheetsApproved",
        header: ({ column }) => <DataTableSortHeader column={column} title="Approved" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.sheetsApproved}</span>,
      },
      {
        accessorKey: "checkinsCompleted",
        header: ({ column }) => <DataTableSortHeader column={column} title="Check-ins" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.checkinsCompleted}</span>,
      },
      {
        accessorKey: "approvalRate",
        header: ({ column }) => <DataTableSortHeader column={column} title="Approval %" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.approvalRate}%</span>,
      },
      {
        accessorKey: "avgApprovalDays",
        header: ({ column }) => <DataTableSortHeader column={column} title="Avg days" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.avgApprovalDays}d</span>,
      },
      {
        accessorKey: "teamCompletionPct",
        header: ({ column }) => <DataTableSortHeader column={column} title="Team %" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.teamCompletionPct}%</span>,
      },
      {
        accessorKey: "escalationCount",
        header: ({ column }) => <DataTableSortHeader column={column} title="Escalations" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.escalationCount}</span>,
      },
    ],
    []
  );

  const lineDepartments = useMemo(() => {
    if (!data?.qoqTrend.length) return [];
    return Array.from(new Set(data.qoqTrend.map((d) => d.department))).slice(0, 6);
  }, [data?.qoqTrend]);

  const pieData = useMemo(
    () =>
      data?.thrustAreaBreakdown.map((t) => ({
        name: t.name,
        value: t.goalCount,
        color: t.color,
      })) ?? [],
    [data?.thrustAreaBreakdown]
  );

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        onChange={handleFilters}
        showDepartment={scope === "admin"}
        showQuarter
      />

      {data?.cycle && (
        <p className="text-sm text-muted-foreground">
          {scope === "manager" ? "Team-scoped" : "Organization-wide"} · {data.cycle.fiscalYear}
          <span className="ml-2 text-emerald-600">● Auto-refresh</span>
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {data?.orgTrends && data.orgTrends.length > 0 && (
            <FadeInView>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quarter-over-quarter trends</CardTitle>
                </CardHeader>
                <CardContent className="h-72 overflow-x-auto">
                  <div className="min-w-[320px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.orgTrends}>
                        {gradientDefs}
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="quarter" />
                        <YAxis />
                        <Tooltip {...chartTooltipStyle} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="completionPct"
                          name="Completion %"
                          stroke="#4f6ef7"
                          fill="url(#brandGradient)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="achievementPct"
                          name="Achievement %"
                          stroke="#10b981"
                          fill="url(#successGradient)"
                          strokeWidth={2}
                        />
                        <Line type="monotone" dataKey="delays" name="Delays" stroke="#f59e0b" />
                        <Line type="monotone" dataKey="escalations" name="Escalations" stroke="#ef4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </FadeInView>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QoQ achievement trend</CardTitle>
              </CardHeader>
              <CardContent className="h-72 overflow-x-auto">
                <div className="min-w-[280px] h-full">
                  {lineData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No achievement data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="quarter" />
                        <YAxis domain={[0, 100]} unit="%" />
                        <Tooltip {...chartTooltipStyle} />
                        <Legend />
                        {lineDepartments.map((dept, i) => (
                          <Line
                            key={dept}
                            type="monotone"
                            dataKey={dept}
                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            animationDuration={800}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thrust area breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {pieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals in cycle</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data?.statusDistribution && data.statusDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goal status distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.statusDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip {...chartTooltipStyle} />
                      <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {data?.uomDistribution && data.uomDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goals by unit of measure</CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.uomDistribution}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                      >
                        {data.uomDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...chartTooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {data?.completionFunnel && data.completionFunnel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organizational completion funnel</CardTitle>
              </CardHeader>
              <CardContent className="h-64 overflow-x-auto">
                <div className="min-w-[300px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.completionFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip {...chartTooltipStyle} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.completionFunnel.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department heatmap (avg progress %)</CardTitle>
            </CardHeader>
            <CardContent className="h-80 overflow-x-auto">
              <div className="min-w-[400px] h-full">
                {(data?.departmentHeatmap.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No department data</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.departmentHeatmap} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="department" width={120} />
                      <Tooltip {...chartTooltipStyle} />
                      <Legend />
                      {QUARTERS.map((q, i) => (
                        <Bar
                          key={q}
                          dataKey={q}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                          radius={[0, 4, 4, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {data?.departmentComparison && data.departmentComparison.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Department comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-72 overflow-x-auto">
                <div className="min-w-[400px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.departmentComparison}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip {...chartTooltipStyle} />
                      <Legend />
                      <Bar dataKey="productivity" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="compliance" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completion" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="delays" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {scope === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manager effectiveness ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={managerEffectivenessColumns}
                  data={data?.managerEffectiveness ?? []}
                  getRowId={(r) => r.managerId}
                  emptyMessage="No manager data for this cycle"
                  emptyIcon={Users}
                  enablePagination
                  pageSize={10}
                  onExport={() =>
                    exportToCsv(
                      (data?.managerEffectiveness ?? []).map((m) => ({
                        rank: m.rank,
                        manager: m.manager,
                        reports: m.totalReports,
                        approved: m.sheetsApproved,
                        checkins: m.checkinsCompleted,
                        approvalRate: m.approvalRate,
                        avgDays: m.avgApprovalDays,
                        teamPct: m.teamCompletionPct,
                        escalations: m.escalationCount,
                      })),
                      [
                        { key: "rank", label: "Rank" },
                        { key: "manager", label: "Manager" },
                        { key: "reports", label: "Reports" },
                        { key: "approved", label: "Approved" },
                        { key: "checkins", label: "Check-ins" },
                        { key: "approvalRate", label: "Approval %" },
                        { key: "avgDays", label: "Avg days" },
                        { key: "teamPct", label: "Team %" },
                        { key: "escalations", label: "Escalations" },
                      ],
                      "manager-effectiveness.csv"
                    )
                  }
                  globalFilterFn={(row, q) =>
                    row.manager.toLowerCase().includes(q.toLowerCase())
                  }
                  renderMobileCard={(m) => (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">#{m.rank}</span>
                          <p className="font-semibold">{m.manager}</p>
                        </div>
                        <span className="text-sm tabular-nums">{m.approvalRate}% approval</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span>{m.totalReports} reports</span>
                        <span>{m.sheetsApproved} approved</span>
                        <span>{m.checkinsCompleted} check-ins</span>
                        <span>{m.escalationCount} escalations</span>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
