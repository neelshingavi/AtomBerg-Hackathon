"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Activity,
} from "lucide-react";
import { DashboardHero } from "@/components/dashboard/shared/DashboardHero";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { FadeIn } from "@/components/motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/design-system";

type ApprovalRow = {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  cycle: string;
  goalsCount: number;
  submittedAt: string | null;
};

type AtRiskEmployee = {
  id: string;
  name: string;
  reason: string;
  severity: "low" | "medium" | "critical";
};

export function ManagerDashboardView({
  pendingApprovals,
  delayedCheckins,
  teamCompletionPct,
  atRiskCount,
  escalationCount,
  approvals,
  atRiskEmployees,
  teamProgress,
}: {
  pendingApprovals: number;
  delayedCheckins: number;
  teamCompletionPct: number;
  atRiskCount: number;
  escalationCount: number;
  approvals: ApprovalRow[];
  atRiskEmployees: AtRiskEmployee[];
  teamProgress: { name: string; pct: number }[];
}) {
  const columns = useMemo<ColumnDef<ApprovalRow, unknown>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: ({ column }) => <DataTableSortHeader column={column} title="Employee" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employeeName}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.employeeCode}</p>
          </div>
        ),
      },
      { accessorKey: "department", header: "Department" },
      { accessorKey: "cycle", header: "Cycle" },
      { accessorKey: "goalsCount", header: "Goals" },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => <DataTableSortHeader column={column} title="Submitted" />,
        cell: ({ row }) =>
          row.original.submittedAt
            ? format(new Date(row.original.submittedAt), "MMM d, yyyy")
            : "—",
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <ButtonLink size="sm" href={`/manager/approvals/${row.original.id}`}>
            Review
          </ButtonLink>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <DashboardHero
        greeting="Team operations"
        subtitle="Review submissions, monitor check-ins, and act on at-risk reports."
        completionPct={teamCompletionPct}
        variant="manager"
      />

      <DashboardStats
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        items={[
          {
            label: "Pending approvals",
            value: pendingApprovals,
            hint: "Needs decision",
            icon: Clock,
            accent: pendingApprovals > 0 ? "warning" : "success",
            trend: pendingApprovals > 0 ? "neutral" : "up",
          },
          {
            label: "Delayed check-ins",
            value: delayedCheckins,
            icon: AlertTriangle,
            accent: delayedCheckins > 0 ? "warning" : "success",
          },
          {
            label: "Team completion",
            value: `${teamCompletionPct}%`,
            icon: TrendingUp,
            accent: teamCompletionPct >= 70 ? "success" : "warning",
            trend: teamCompletionPct >= 50 ? "up" : "down",
          },
          {
            label: "At-risk employees",
            value: atRiskCount,
            icon: Users,
            accent: atRiskCount > 0 ? "warning" : "success",
          },
          {
            label: "Escalations",
            value: escalationCount,
            icon: Activity,
            accent: escalationCount > 0 ? "warning" : "neutral",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <FadeIn className="xl:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="type-section">Approval queue</h3>
            <ButtonLink href="/manager/approvals" variant="outline" size="sm">
              View all
            </ButtonLink>
          </div>
          <DataTable
            columns={columns}
            data={approvals}
            enablePagination
            pageSize={5}
            emptyMessage="No pending approvals — your team is caught up."
            emptyIcon={CheckSquare}
            enableColumnVisibility={false}
            globalFilterFn={(row, q) =>
              row.employeeName.toLowerCase().includes(q.toLowerCase()) ||
              row.department.toLowerCase().includes(q.toLowerCase())
            }
          />
        </FadeIn>

        <FadeIn>
          <Card className="enterprise-card h-full">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                At-risk employees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {atRiskEmployees.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No employees flagged at this time.
                </p>
              ) : (
                <ul className="divide-y max-h-80 overflow-y-auto">
                  {atRiskEmployees.map((e) => (
                    <li key={e.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.reason}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] capitalize", statusColors[e.severity])}
                        >
                          {e.severity}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card className="enterprise-card">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card">Team progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {teamProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team data yet.</p>
              ) : (
                teamProgress.map((m) => (
                  <div key={m.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{m.name}</span>
                      <span className="tabular-nums text-muted-foreground">{m.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${Math.min(100, m.pct)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <ActivityFeed limit={6} enhanced />
      </div>
    </div>
  );
}
