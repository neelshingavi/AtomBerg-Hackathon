"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";
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
import { BulkActionBar, BulkActionButton } from "@/components/operations/bulk-action-bar";
import { TableFilterBar } from "@/components/operations/table-filters";
import { exportToCsv } from "@/lib/export-table";

type UserRow = {
  id: string;
  email: string;
  name: string;
  employeeCode: string;
  role: string;
  isActive: boolean;
  department: { id: string; name: string };
  manager: { id: string; name: string } | null;
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignDeptOpen, setAssignDeptOpen] = useState(false);
  const [bulkDepartmentId, setBulkDepartmentId] = useState("");
  const [selected, setSelected] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [form, setForm] = useState({
    email: "",
    name: "",
    employeeCode: "",
    password: "",
    role: "EMPLOYEE",
    departmentId: "",
    managerId: "",
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/users?includeInactive=true");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.users as UserRow[];
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

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          managerId: form.managerId || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("User created");
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (payload: {
      userIds: string[];
      action: "activate" | "deactivate" | "assign_department";
      departmentId?: string;
    }) => {
      const res = await fetch("/api/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { count: number };
    },
    onSuccess: (result, vars) => {
      const label =
        vars.action === "activate"
          ? "activated"
          : vars.action === "deactivate"
            ? "deactivated"
            : "updated";
      toast.success(`${result.count} user(s) ${label}`);
      setSelected([]);
      setAssignDeptOpen(false);
      setBulkDepartmentId("");
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const managers = usersData?.filter((u) => u.role === "MANAGER" && u.isActive) ?? [];

  const filtered = useMemo(() => {
    let rows = usersData ?? [];
    if (roleFilter !== "all") rows = rows.filter((u) => u.role === roleFilter);
    if (statusFilter === "active") rows = rows.filter((u) => u.isActive);
    if (statusFilter === "inactive") rows = rows.filter((u) => !u.isActive);
    if (departmentFilter !== "all")
      rows = rows.filter((u) => u.department.id === departmentFilter);
    return rows;
  }, [usersData, roleFilter, statusFilter, departmentFilter]);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; value: string }[] = [];
    if (roleFilter !== "all") chips.push({ id: "role", label: "Role", value: roleFilter });
    if (statusFilter !== "all")
      chips.push({ id: "status", label: "Status", value: statusFilter });
    if (departmentFilter !== "all") {
      const dept = departments?.find((d) => d.id === departmentFilter);
      chips.push({ id: "department", label: "Department", value: dept?.name ?? departmentFilter });
    }
    return chips;
  }, [roleFilter, statusFilter, departmentFilter, departments]);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableSortHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "employeeCode",
        header: ({ column }) => <DataTableSortHeader column={column} title="Code" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.employeeCode}</span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableSortHeader column={column} title="Email" />,
      },
      {
        id: "department",
        accessorFn: (row) => row.department.name,
        header: ({ column }) => <DataTableSortHeader column={column} title="Department" />,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
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
            onClick={() =>
              toggleActive.mutate({
                id: row.original.id,
                isActive: !row.original.isActive,
              })
            }
          >
            {row.original.isActive ? "Deactivate" : "Activate"}
          </Button>
        ),
      },
    ],
    [toggleActive]
  );

  const handleExport = () => {
    exportToCsv(
      filtered.map((u) => ({
        name: u.name,
        employeeCode: u.employeeCode,
        email: u.email,
        department: u.department.name,
        role: u.role,
        status: u.isActive ? "Active" : "Inactive",
        manager: u.manager?.name ?? "",
      })),
      [
        { key: "name", label: "Name" },
        { key: "employeeCode", label: "Code" },
        { key: "email", label: "Email" },
        { key: "department", label: "Department" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "manager", label: "Manager" },
      ],
      "users.csv"
    );
  };

  return (
    <>
      <Topbar title="User management" />
      <PageContainer>
        <PageHeader
          title="Users"
          description="Create, edit roles, and deactivate users."
          actions={<Button onClick={() => setCreateOpen(true)}>Add user</Button>}
        />

        {selected.length > 0 && (
          <BulkActionBar count={selected.length} className="mb-4">
            <BulkActionButton
              onClick={() =>
                bulkUpdate.mutate({
                  userIds: selected.map((u) => u.id),
                  action: "activate",
                })
              }
              disabled={bulkUpdate.isPending}
            >
              Activate
            </BulkActionButton>
            <BulkActionButton
              variant="destructive"
              onClick={() =>
                bulkUpdate.mutate({
                  userIds: selected.map((u) => u.id),
                  action: "deactivate",
                })
              }
              disabled={bulkUpdate.isPending}
            >
              Deactivate
            </BulkActionButton>
            <BulkActionButton onClick={() => setAssignDeptOpen(true)}>
              Assign department
            </BulkActionButton>
          </BulkActionBar>
        )}

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          enablePagination
          pageSize={10}
          enableRowSelection
          getRowId={(r) => r.id}
          onSelectedRowsChange={setSelected}
          emptyMessage="No users found"
          emptyIcon={Users}
          onExport={handleExport}
          filterToolbar={
            <TableFilterBar
              chips={filterChips}
              onRemoveChip={(id) => {
                if (id === "role") setRoleFilter("all");
                if (id === "status") setStatusFilter("all");
                if (id === "department") setDepartmentFilter("all");
              }}
              onClearAll={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setDepartmentFilter("all");
              }}
            >
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="space-y-1">
                <Label>Department</Label>
                <Select
                  value={departmentFilter}
                  onValueChange={(v) => v && setDepartmentFilter(v)}
                >
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TableFilterBar>
          }
          globalFilterFn={(row, q) => {
            const lower = q.toLowerCase();
            return (
              row.name.toLowerCase().includes(lower) ||
              row.email.toLowerCase().includes(lower) ||
              row.employeeCode.toLowerCase().includes(lower) ||
              row.department.name.toLowerCase().includes(lower) ||
              row.role.toLowerCase().includes(lower)
            );
          }}
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{row.employeeCode}</p>
                </div>
                <Badge variant={row.isActive ? "default" : "secondary"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{row.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{row.role}</Badge>
                <Badge variant="outline">{row.department.name}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toggleActive.mutate({ id: row.id, isActive: !row.isActive })
                }
              >
                {row.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          )}
        />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Employee code</Label>
                  <Input
                    value={form.employeeCode}
                    onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => v && setForm({ ...form, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => v && setForm({ ...form, departmentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Manager (optional)</Label>
                <Select
                  value={form.managerId || "__none__"}
                  onValueChange={(v) =>
                    v && setForm({ ...form, managerId: v === "__none__" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createUser.mutate()}
                disabled={createUser.isPending || !form.departmentId}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={assignDeptOpen} onOpenChange={setAssignDeptOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign department</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Department for {selected.length} user(s)</Label>
              <Select
                value={bulkDepartmentId}
                onValueChange={(v) => v && setBulkDepartmentId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDeptOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!bulkDepartmentId || bulkUpdate.isPending}
                onClick={() =>
                  bulkUpdate.mutate({
                    userIds: selected.map((u) => u.id),
                    action: "assign_department",
                    departmentId: bulkDepartmentId,
                  })
                }
              >
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
