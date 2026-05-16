"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { ExportButton } from "@/components/reports/ExportButton";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ReportRow = Record<string, string | number>;

const PREVIEW_COLUMNS = [
  "Employee Code",
  "Employee Name",
  "Department",
  "Goal Title",
  "Weightage (%)",
  "Q1 Score (%)",
  "Q2 Score (%)",
];

export default function AchievementReportPage() {
  const [cycleId, setCycleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [quarter, setQuarter] = useState("");

  const { data: cycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      return json.data.cycles as Array<{ id: string; name: string; isActive: boolean }>;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      const json = await res.json();
      return json.data.departments as Array<{ id: string; name: string }>;
    },
  });

  const activeCycleId = cycleId || cycles?.find((c) => c.isActive)?.id || "";

  const { data: rows, isLoading } = useQuery({
    queryKey: ["report", "achievement", activeCycleId, departmentId, quarter],
    enabled: !!activeCycleId,
    queryFn: async () => {
      const qs = new URLSearchParams({ cycleId: activeCycleId, format: "json" });
      if (departmentId) qs.set("departmentId", departmentId);
      if (quarter) qs.set("quarter", quarter);
      const res = await fetch(`/api/reports/achievement?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.report as ReportRow[];
    },
  });

  const columnKeys = useMemo(() => {
    if (!rows?.length) return PREVIEW_COLUMNS;
    const keys = Object.keys(rows[0]);
    const preferred = PREVIEW_COLUMNS.filter((k) => keys.includes(k));
    const rest = keys.filter((k) => !preferred.includes(k)).slice(0, 4);
    return [...preferred, ...rest];
  }, [rows]);

  const tableColumns = useMemo<ColumnDef<ReportRow>[]>(
    () =>
      columnKeys.map((key) => ({
        accessorKey: key,
        header: ({ column }) => <DataTableSortHeader column={column} title={key} />,
        cell: ({ row }) => row.getValue(key) ?? "—",
      })),
    [columnKeys]
  );

  return (
    <>
      <Topbar title="Achievement report" />
      <PageContainer>
        <div className="flex flex-wrap gap-4 mb-6 items-end">
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
          <div className="space-y-1">
            <Label>Department</Label>
            <Select
              value={departmentId || "__all__"}
              onValueChange={(v) => v && setDepartmentId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All departments</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Quarter</Label>
            <Select
              value={quarter || "__all__"}
              onValueChange={(v) => v && setQuarter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All quarters</SelectItem>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeCycleId && (
            <div className="flex gap-2 ml-auto">
              <ExportButton
                cycleId={activeCycleId}
                departmentId={departmentId}
                quarter={quarter}
                format="csv"
              />
              <ExportButton
                cycleId={activeCycleId}
                departmentId={departmentId}
                quarter={quarter}
                format="xlsx"
                label="Excel"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DataTable
            columns={tableColumns}
            data={rows ?? []}
            emptyMessage="No approved locked sheets for selected filters"
          />
        )}
      </PageContainer>
    </>
  );
}
