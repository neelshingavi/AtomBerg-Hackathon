"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ThrustArea = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function AdminThrustAreasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "thrust-areas"],
    queryFn: async () => {
      const res = await fetch("/api/thrust-areas?all=true");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.thrustAreas as ThrustArea[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/thrust-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Thrust area created");
      setOpen(false);
      setName("");
      setDescription("");
      void qc.invalidateQueries({ queryKey: ["admin", "thrust-areas"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/thrust-areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "thrust-areas"] }),
  });

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (statusFilter === "active") return rows.filter((t) => t.isActive);
    if (statusFilter === "inactive") return rows.filter((t) => !t.isActive);
    return rows;
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<ThrustArea>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableSortHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="max-w-md truncate text-sm text-muted-foreground">
            {row.original.description ?? "—"}
          </span>
        ),
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
      <Topbar title="Thrust areas" />
      <PageContainer>
        <PageHeader
          title="Thrust areas"
          description="Strategic thrust areas for goal alignment."
          actions={<Button onClick={() => setOpen(true)}>Add thrust area</Button>}
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          enablePagination
          pageSize={10}
          getRowId={(r) => r.id}
          emptyMessage="No thrust areas found"
          emptyIcon={Layers}
          onExport={() =>
            exportToCsv(
              filtered.map((t) => ({
                name: t.name,
                description: t.description ?? "",
                status: t.isActive ? "Active" : "Inactive",
              })),
              [
                { key: "name", label: "Name" },
                { key: "description", label: "Description" },
                { key: "status", label: "Status" },
              ],
              "thrust-areas.csv"
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
              row.name.toLowerCase().includes(lower) ||
              (row.description?.toLowerCase().includes(lower) ?? false)
            );
          }}
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{row.name}</p>
                <Badge variant={row.isActive ? "default" : "secondary"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {row.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{row.description}</p>
              )}
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
              <DialogTitle>Add thrust area</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
