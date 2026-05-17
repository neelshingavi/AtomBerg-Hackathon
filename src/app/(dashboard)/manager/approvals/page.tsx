"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useGoalSheets } from "@/hooks/useGoals";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LiveApprovalQueue } from "@/components/realtime/LiveApprovalQueue";
import { BulkActionBar, BulkActionButton } from "@/components/operations/bulk-action-bar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ApprovalRow = {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  cycle: string;
  goalsCount: number;
  submittedAt: string | null;
  status: string;
};

export default function ManagerApprovalsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useGoalSheets({ status: "SUBMITTED" });
  const [selected, setSelected] = useState<ApprovalRow[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const rows: ApprovalRow[] = useMemo(
    () =>
      (data?.goalSheets ?? []).map((sheet) => ({
        id: sheet.id,
        employeeName: sheet.employee.name,
        employeeCode: sheet.employee.employeeCode ?? "",
        department: sheet.employee.department.name,
        cycle: sheet.cycle.name,
        goalsCount: sheet.goalsCount,
        submittedAt: sheet.submittedAt,
        status: sheet.status,
      })),
    [data]
  );

  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/goals/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetIds: ids }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (result) => {
      toast.success(`Approved ${result.approved.length} sheet(s)`);
      setSelected([]);
      void qc.invalidateQueries({ queryKey: ["goal-sheets"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkReject = useMutation({
    mutationFn: async ({ ids, note }: { ids: string[]; note: string }) => {
      const res = await fetch("/api/goals/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalSheetIds: ids, managerNote: note }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (result) => {
      toast.success(`Returned ${result.rejected.length} sheet(s) for rework`);
      setRejectOpen(false);
      setRejectNote("");
      setSelected([]);
      void qc.invalidateQueries({ queryKey: ["goal-sheets"] });
    },
    onError: (e) => toast.error(e.message),
  });

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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <GoalStatusBadge status={row.original.status as never} />,
      },
      {
        id: "actions",
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
    <>
      <Topbar title="Approvals" />
      <PageContainer>
        <PageHeader
          title="Approval queue"
          description="Review and approve goal sheets from your direct reports."
        />

        <div className="mb-6 max-w-md">
          <LiveApprovalQueue />
        </div>

        {selected.length > 0 && (
          <BulkActionBar count={selected.length} className="mb-4">
            <BulkActionButton
              onClick={() => bulkApprove.mutate(selected.map((s) => s.id))}
              disabled={bulkApprove.isPending}
            >
              Approve all
            </BulkActionButton>
            <BulkActionButton variant="destructive" onClick={() => setRejectOpen(true)}>
              Reject all
            </BulkActionButton>
          </BulkActionBar>
        )}

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          enablePagination
          pageSize={10}
          enableRowSelection
          getRowId={(r) => r.id}
          onSelectedRowsChange={setSelected}
          emptyMessage="No pending approvals"
          emptyIcon={CheckSquare}
          globalFilterFn={(row, q) =>
            row.employeeName.toLowerCase().includes(q.toLowerCase()) ||
            row.department.toLowerCase().includes(q.toLowerCase()) ||
            row.employeeCode.toLowerCase().includes(q.toLowerCase())
          }
          renderMobileCard={(row) => (
            <div className="space-y-2">
              <p className="font-semibold">{row.employeeName}</p>
              <p className="text-xs text-muted-foreground">{row.department} · {row.cycle}</p>
              <GoalStatusBadge status={row.status as never} />
              <ButtonLink size="sm" href={`/manager/approvals/${row.id}`}>
                Review
              </ButtonLink>
            </div>
          )}
        />

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk reject {selected.length} sheet(s)</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Comment for employees</Label>
              <Textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explain what needs to change…"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectNote.trim() || bulkReject.isPending}
                onClick={() =>
                  bulkReject.mutate({
                    ids: selected.map((s) => s.id),
                    note: rejectNote,
                  })
                }
              >
                Reject selected
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
