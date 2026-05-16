"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Target } from "lucide-react";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { ButtonLink } from "@/components/ui/button-link";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import type { GoalSheetSummary } from "@/hooks/useGoals";
import { exportToCsv } from "@/lib/export-table";

export function GoalTable({ sheets, isLoading }: { sheets: GoalSheetSummary[]; isLoading?: boolean }) {
  const columns = useMemo<ColumnDef<GoalSheetSummary>[]>(
    () => [
      {
        accessorKey: "cycle.name",
        id: "cycle",
        header: ({ column }) => <DataTableSortHeader column={column} title="Cycle" />,
        cell: ({ row }) => <span className="font-medium">{row.original.cycle.name}</span>,
        sortingFn: (a, b) => a.original.cycle.name.localeCompare(b.original.cycle.name),
      },
      {
        accessorKey: "goalsCount",
        header: ({ column }) => <DataTableSortHeader column={column} title="Goals" />,
      },
      {
        accessorKey: "totalWeightage",
        header: ({ column }) => <DataTableSortHeader column={column} title="Weightage" />,
        cell: ({ row }) => `${row.original.totalWeightage}%`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <GoalStatusBadge status={row.original.status} />,
      },
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
        cell: ({ row }) => (
          <ButtonLink variant="outline" size="sm" href={`/employee/goals/${row.original.id}`}>
            View
          </ButtonLink>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={sheets}
      isLoading={isLoading}
      getRowId={(r) => r.id}
      emptyMessage="No goal sheets yet"
      emptyIcon={Target}
      emptyAction={
        <ButtonLink href="/employee/goals/new">Create goal sheet</ButtonLink>
      }
      globalFilterFn={(row, q) =>
        row.cycle.name.toLowerCase().includes(q.toLowerCase()) ||
        row.status.toLowerCase().includes(q.toLowerCase())
      }
      onExport={() =>
        exportToCsv(
          sheets.map((s) => ({
            cycle: s.cycle.name,
            goals: s.goalsCount,
            weightage: s.totalWeightage,
            status: s.status,
            submitted: s.submittedAt ?? "",
          })),
          [
            { key: "cycle", label: "Cycle" },
            { key: "goals", label: "Goals" },
            { key: "weightage", label: "Weightage" },
            { key: "status", label: "Status" },
            { key: "submitted", label: "Submitted" },
          ],
          "my-goal-sheets.csv"
        )
      }
      renderMobileCard={(sheet) => (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{sheet.cycle.name}</p>
            <GoalStatusBadge status={sheet.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {sheet.goalsCount} goals · {sheet.totalWeightage}% weightage
          </p>
          <ButtonLink variant="outline" size="sm" href={`/employee/goals/${sheet.id}`}>
            View sheet
          </ButtonLink>
        </div>
      )}
    />
  );
}
