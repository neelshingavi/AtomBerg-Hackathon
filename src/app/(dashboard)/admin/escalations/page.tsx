"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkActionBar, BulkActionButton } from "@/components/operations/bulk-action-bar";
import { TableFilterBar } from "@/components/operations/table-filters";
import { exportToCsv } from "@/lib/export-table";
import { EscalationIntelligence } from "@/components/analytics/EscalationIntelligence";
import { RiskBadge } from "@/components/analytics/RiskBadge";
import { computeEscalationSeverity, computeDaysOverdue } from "@/lib/risk/escalation-utils";
import type { EscalationTrigger } from "@prisma/client";

type EscalationRule = {
  id: string;
  trigger: string;
  daysThreshold: number;
  isActive: boolean;
  notifyEmployee: boolean;
  notifyManager: boolean;
  notifyHR: boolean;
  _count: { escalationLogs: number };
};

type EscalationLog = {
  id: string;
  status: string;
  createdAt: string;
  employee: { name: string; employeeCode: string };
  manager: { name: string } | null;
  rule: { trigger: string; daysThreshold: number };
};

const TRIGGER_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: "Goal not submitted",
  GOAL_NOT_APPROVED: "Goal not approved",
  CHECKIN_NOT_COMPLETED: "Check-in not completed",
};

export default function AdminEscalationsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<EscalationLog[]>([]);
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [form, setForm] = useState({
    trigger: "GOAL_NOT_SUBMITTED",
    daysThreshold: 7,
    notifyEmployee: true,
    notifyManager: true,
    notifyHR: false,
  });

  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["escalation-rules"],
    queryFn: async () => {
      const res = await fetch("/api/escalations/rules");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.rules as EscalationRule[];
    },
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["escalation-logs"],
    queryFn: async () => {
      const res = await fetch("/api/escalations/logs?limit=100");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.logs as EscalationLog[];
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/escalations/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Rule created");
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ["escalation-rules"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/escalations/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["escalation-rules"] }),
  });

  const bulkResolve = useMutation({
    mutationFn: async (logIds: string[]) => {
      const res = await fetch("/api/escalations/logs/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logIds, action: "resolve" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { updated: number };
    },
    onSuccess: (result) => {
      toast.success(`Resolved ${result.updated} escalation(s)`);
      setSelectedLogs([]);
      void qc.invalidateQueries({ queryKey: ["escalation-logs"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const ruleColumns = useMemo<ColumnDef<EscalationRule>[]>(
    () => [
      {
        id: "trigger",
        accessorFn: (row) => TRIGGER_LABELS[row.trigger] ?? row.trigger,
        header: ({ column }) => <DataTableSortHeader column={column} title="Trigger" />,
      },
      {
        accessorKey: "daysThreshold",
        header: ({ column }) => <DataTableSortHeader column={column} title="Days" />,
      },
      {
        id: "notify",
        header: "Notify",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {[
              row.original.notifyEmployee && "Employee",
              row.original.notifyManager && "Manager",
              row.original.notifyHR && "HR",
            ]
              .filter(Boolean)
              .join(", ") || "—"}
          </span>
        ),
      },
      {
        id: "logs",
        accessorFn: (row) => row._count.escalationLogs,
        header: ({ column }) => <DataTableSortHeader column={column} title="Logs" />,
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => (
          <Button
            variant={row.original.isActive ? "default" : "outline"}
            size="sm"
            onClick={() => toggleRule.mutate({ id: row.original.id, isActive: !row.original.isActive })}
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Button>
        ),
      },
    ],
    [toggleRule]
  );

  const filteredLogs = useMemo(() => {
    const rows = logs ?? [];
    if (logStatusFilter === "all") return rows;
    return rows.filter((l) => l.status === logStatusFilter);
  }, [logs, logStatusFilter]);

  const logColumns = useMemo<ColumnDef<EscalationLog>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableSortHeader column={column} title="When" />,
        cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy"),
      },
      {
        id: "employee",
        accessorFn: (row) => row.employee.name,
        header: ({ column }) => <DataTableSortHeader column={column} title="Employee" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employee.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.employee.employeeCode}
            </p>
          </div>
        ),
      },
      {
        id: "trigger",
        header: "Trigger",
        cell: ({ row }) => (
          <span className="text-sm">
            {TRIGGER_LABELS[row.original.rule.trigger] ?? row.original.rule.trigger}
            <span className="text-muted-foreground"> ({row.original.rule.daysThreshold}d)</span>
          </span>
        ),
      },
      {
        id: "manager",
        accessorFn: (row) => row.manager?.name ?? "—",
        header: "Manager",
      },
      {
        id: "severity",
        header: "Severity",
        cell: ({ row }) => {
          const createdAt = new Date(row.original.createdAt);
          const rule = {
            trigger: row.original.rule.trigger as EscalationTrigger,
            daysThreshold: row.original.rule.daysThreshold,
          };
          const overdue = computeDaysOverdue({ createdAt, rule });
          return (
            <div className="flex flex-col gap-1">
              <RiskBadge
                level={computeEscalationSeverity({
                  status: row.original.status as "PENDING",
                  createdAt,
                  rule,
                })}
              />
              {overdue > 0 && (
                <span className="text-[10px] text-red-600">+{overdue}d overdue</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
      },
    ],
    []
  );

  return (
    <>
      <Topbar title="Escalations" />
      <PageContainer className="space-y-8">
        <EscalationIntelligence />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Escalation rules</CardTitle>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Add rule
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={ruleColumns}
              data={rules ?? []}
              isLoading={rulesLoading}
              enablePagination
              pageSize={5}
              getRowId={(r) => r.id}
              emptyMessage="No escalation rules"
              globalFilterFn={(row, q) => {
                const label = TRIGGER_LABELS[row.trigger] ?? row.trigger;
                return label.toLowerCase().includes(q.toLowerCase());
              }}
              renderMobileCard={(row) => (
                <div className="space-y-2">
                  <p className="font-semibold">{TRIGGER_LABELS[row.trigger] ?? row.trigger}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.daysThreshold} days · {row._count.escalationLogs} logs
                  </p>
                  <Badge variant={row.isActive ? "default" : "secondary"}>
                    {row.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleRule.mutate({ id: row.id, isActive: !row.isActive })}
                  >
                    Toggle
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent escalation log</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLogs.length > 0 && (
              <BulkActionBar count={selectedLogs.length} className="mb-4">
                <BulkActionButton
                  onClick={() => bulkResolve.mutate(selectedLogs.map((l) => l.id))}
                  disabled={bulkResolve.isPending}
                >
                  Resolve selected
                </BulkActionButton>
              </BulkActionBar>
            )}

            <DataTable
              columns={logColumns}
              data={filteredLogs}
              isLoading={logsLoading}
              enablePagination
              pageSize={10}
              enableRowSelection
              getRowId={(r) => r.id}
              onSelectedRowsChange={setSelectedLogs}
              emptyMessage="No escalations logged yet"
              emptyIcon={AlertTriangle}
              onExport={() =>
                exportToCsv(
                  filteredLogs.map((l) => ({
                    when: format(new Date(l.createdAt), "yyyy-MM-dd"),
                    employee: l.employee.name,
                    code: l.employee.employeeCode,
                    trigger: TRIGGER_LABELS[l.rule.trigger] ?? l.rule.trigger,
                    manager: l.manager?.name ?? "",
                    status: l.status,
                  })),
                  [
                    { key: "when", label: "When" },
                    { key: "employee", label: "Employee" },
                    { key: "code", label: "Code" },
                    { key: "trigger", label: "Trigger" },
                    { key: "manager", label: "Manager" },
                    { key: "status", label: "Status" },
                  ],
                  "escalation-logs.csv"
                )
              }
              filterToolbar={
                <TableFilterBar
                  chips={
                    logStatusFilter !== "all"
                      ? [{ id: "status", label: "Status", value: logStatusFilter }]
                      : []
                  }
                  onRemoveChip={() => setLogStatusFilter("all")}
                >
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={logStatusFilter} onValueChange={(v) => v && setLogStatusFilter(v)}>
                      <SelectTrigger className="h-9 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableFilterBar>
              }
              globalFilterFn={(row, q) => {
                const lower = q.toLowerCase();
                return (
                  row.employee.name.toLowerCase().includes(lower) ||
                  row.employee.employeeCode.toLowerCase().includes(lower) ||
                  (TRIGGER_LABELS[row.rule.trigger] ?? row.rule.trigger)
                    .toLowerCase()
                    .includes(lower) ||
                  (row.manager?.name.toLowerCase().includes(lower) ?? false) ||
                  row.status.toLowerCase().includes(lower)
                );
              }}
              renderMobileCard={(row) => {
                const overdue = computeDaysOverdue({
                  createdAt: row.createdAt,
                  rule: row.rule,
                });
                return (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{row.employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(row.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline">{row.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {TRIGGER_LABELS[row.rule.trigger] ?? row.rule.trigger}
                    </p>
                    <RiskBadge
                      level={computeEscalationSeverity({
                        status: row.status as "PENDING",
                        createdAt: row.createdAt,
                        rule: row.rule,
                      })}
                    />
                    {overdue > 0 && (
                      <span className="text-xs text-red-600">+{overdue}d overdue</span>
                    )}
                  </div>
                );
              }}
            />
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add escalation rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Trigger</Label>
                <Select
                  value={form.trigger}
                  onValueChange={(v) => v && setForm({ ...form, trigger: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Days threshold</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.daysThreshold}
                  onChange={(e) =>
                    setForm({ ...form, daysThreshold: Number(e.target.value) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyEmployee}
                  onChange={(e) => setForm({ ...form, notifyEmployee: e.target.checked })}
                />
                Notify employee
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyManager}
                  onChange={(e) => setForm({ ...form, notifyManager: e.target.checked })}
                />
                Notify manager
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyHR}
                  onChange={(e) => setForm({ ...form, notifyHR: e.target.checked })}
                />
                Notify HR (admins)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createRule.mutate()} disabled={createRule.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
