"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTeam } from "@/hooks/useCheckins";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TableFilterBar } from "@/components/operations/table-filters";

type TeamRow = {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  goalStatus: string | null;
  sheetId: string | null;
  canCheckin: boolean;
};

export default function ManagerTeamPage() {
  const { data, isLoading } = useTeam();
  const [statusFilter, setStatusFilter] = useState("all");

  const rows: TeamRow[] = useMemo(
    () =>
      (data?.team ?? []).map((member) => {
        const sheet = member.goalSheets?.[0];
        return {
          id: member.id,
          name: member.name,
          employeeCode: member.employeeCode ?? "",
          department: member.department.name,
          goalStatus: sheet?.status ?? null,
          sheetId: sheet?.id ?? null,
          canCheckin: sheet?.status === "APPROVED",
        };
      }),
    [data]
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    if (statusFilter === "none") return rows.filter((r) => !r.goalStatus);
    return rows.filter((r) => r.goalStatus === statusFilter);
  }, [rows, statusFilter]);

  const columns = useMemo<ColumnDef<TeamRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableSortHeader column={column} title="Employee" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.employeeCode}</p>
          </div>
        ),
      },
      { accessorKey: "department", header: "Department" },
      {
        accessorKey: "goalStatus",
        header: "Goal status",
        cell: ({ row }) =>
          row.original.goalStatus ? (
            <GoalStatusBadge status={row.original.goalStatus as never} />
          ) : (
            <span className="text-sm text-muted-foreground">No sheet</span>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) =>
          row.original.canCheckin && row.original.sheetId ? (
            <ButtonLink size="sm" href={`/manager/team/${row.original.id}/checkin`}>
              Review check-in
            </ButtonLink>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    []
  );

  return (
    <>
      <Topbar title="My team" />
      <PageContainer>
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          getRowId={(r) => r.id}
          emptyMessage="No direct reports"
          emptyIcon={Users}
          filterToolbar={
            <TableFilterBar
              chips={
                statusFilter !== "all"
                  ? [{ id: "status", label: "Status", value: statusFilter }]
                  : []
              }
              onRemoveChip={() => setStatusFilter("all")}
            >
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="none">No sheet</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TableFilterBar>
          }
          globalFilterFn={(row, q) =>
            row.name.toLowerCase().includes(q.toLowerCase()) ||
            row.employeeCode.toLowerCase().includes(q.toLowerCase()) ||
            row.department.toLowerCase().includes(q.toLowerCase())
          }
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <p className="font-semibold">{row.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
              <Badge variant="outline">{row.department}</Badge>
              {row.goalStatus ? (
                <GoalStatusBadge status={row.goalStatus as never} />
              ) : (
                <span className="text-sm text-muted-foreground">No goal sheet</span>
              )}
              {row.canCheckin && row.sheetId && (
                <ButtonLink size="sm" href={`/manager/team/${row.id}/checkin`}>
                  Review check-in
                </ButtonLink>
              )}
            </div>
          )}
        />
      </PageContainer>
    </>
  );
}
