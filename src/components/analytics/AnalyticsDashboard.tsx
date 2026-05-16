"use client";

import { useMemo, useState } from "react";
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
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CHART_COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

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
  }>;
};

export function AnalyticsDashboard({ scope }: { scope: "admin" | "manager" }) {
  const [cycleId, setCycleId] = useState("");

  const { data: cycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      return json.data.cycles as Array<{ id: string; name: string; isActive: boolean }>;
    },
  });

  const activeCycleId = cycleId || cycles?.find((c) => c.isActive)?.id || "";

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", activeCycleId, scope],
    enabled: !!activeCycleId,
    queryFn: async () => {
      const res = await fetch(`/api/reports/analytics?cycleId=${activeCycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AnalyticsData;
    },
  });

  const lineData = useMemo(() => {
    if (!data?.qoqTrend.length) return [];
    const departments = Array.from(
      new Set(data.qoqTrend.map((d) => d.department))
    ).slice(0, 6);
    return QUARTERS.map((quarter) => {
      const row: Record<string, string | number> = { quarter };
      for (const dept of departments) {
        const pt = data.qoqTrend.find(
          (d) => d.department === dept && d.quarter === quarter
        );
        row[dept] = pt?.avgScore ?? 0;
      }
      return row;
    });
  }, [data?.qoqTrend]);

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
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Cycle</Label>
          <Select
            value={activeCycleId}
            onValueChange={(v) => v && setCycleId(v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycles?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data?.cycle && (
          <p className="text-sm text-muted-foreground pb-2">
            {scope === "manager" ? "Team-scoped" : "Organization-wide"} · {data.cycle.fiscalYear}
          </p>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QoQ achievement trend</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {lineData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No achievement data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="quarter" />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip />
                      <Legend />
                      {lineDepartments.map((dept, i) => (
                        <Line
                          key={dept}
                          type="monotone"
                          dataKey={dept}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
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
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department heatmap (avg progress %)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {(data?.departmentHeatmap.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No department data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.departmentHeatmap} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="department" width={120} />
                    <Tooltip />
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
            </CardContent>
          </Card>

          {scope === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manager effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Reports</TableHead>
                      <TableHead className="text-right">Approved</TableHead>
                      <TableHead className="text-right">Check-ins</TableHead>
                      <TableHead className="text-right">Approval %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.managerEffectiveness.map((m) => (
                      <TableRow key={m.managerId}>
                        <TableCell className="font-medium">{m.manager}</TableCell>
                        <TableCell className="text-right">{m.totalReports}</TableCell>
                        <TableCell className="text-right">{m.sheetsApproved}</TableCell>
                        <TableCell className="text-right">{m.checkinsCompleted}</TableCell>
                        <TableCell className="text-right">{m.approvalRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
