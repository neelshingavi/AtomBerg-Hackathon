"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { TableFilterBar } from "@/components/operations/table-filters";
import { exportToCsv } from "@/lib/export-table";

type Dept = { id: string; name: string; code: string; isActive: boolean; _count?: { users: number } };

export default function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.departments as Dept[];
    },
  });

  const createDept = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Department created");
      setOpen(false);
      setName("");
      setCode("");
      void qc.invalidateQueries({ queryKey: ["admin", "departments"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "departments"] }),
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (statusFilter === "active") return rows.filter((d) => d.isActive);
    if (statusFilter === "inactive") return rows.filter((d) => !d.isActive);
    return rows;
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<Dept>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableSortHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "code",
        header: ({ column }) => <DataTableSortHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        id: "users",
        accessorFn: (row) => row._count?.users ?? 0,
        header: ({ column }) => <DataTableSortHeader column={column} title="Users" />,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleActive.mutate({ id: row.original.id, isActive: !row.original.isActive })}
          >
            {row.original.isActive ? "Deactivate" : "Activate"}
          </Button>
        ),
      },
    ],
    [toggleActive]
  );

  return (
    <>
      <Topbar title="Departments" />
      <PageContainer>
        <PageHeader
          title="Departments"
          description="Manage organizational departments."
          actions={<Button onClick={() => setOpen(true)}>Add department</Button>}
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          enablePagination
          pageSize={10}
          getRowId={(r) => r.id}
          emptyMessage="No departments found"
          emptyIcon={Building2}
          onExport={() =>
            exportToCsv(
              filtered.map((d) => ({
                name: d.name,
                code: d.code,
                users: d._count?.users ?? 0,
                status: d.isActive ? "Active" : "Inactive",
              })),
              [
                { key: "name", label: "Name" },
                { key: "code", label: "Code" },
                { key: "users", label: "Users" },
                { key: "status", label: "Status" },
              ],
              "departments.csv"
            )
          }
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
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TableFilterBar>
          }
          globalFilterFn={(row, q) => {
            const lower = q.toLowerCase();
            return (
              row.name.toLowerCase().includes(lower) || row.code.toLowerCase().includes(lower)
            );
          }}
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{row.code}</p>
                </div>
                <Badge variant={row.isActive ? "default" : "secondary"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{row._count?.users ?? 0} users</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive.mutate({ id: row.id, isActive: !row.isActive })}
              >
                {row.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          )}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add department</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createDept.mutate()} disabled={createDept.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
