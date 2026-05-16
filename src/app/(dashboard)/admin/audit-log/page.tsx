"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { TableScroll } from "@/components/layout/TableScroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText } from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  metadata: unknown;
  previousValues: unknown;
  newValues: unknown;
  createdBy: { name: string; email: string };
  affectedUser: { name: string } | null;
  goalSheet: {
    employee: { name: string; employeeCode: string };
  } | null;
};

function DiffBlock({ label, value }: { label: string; value: unknown }) {
  if (value == null || (typeof value === "object" && Object.keys(value as object).length === 0)) {
    return null;
  }
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, action],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: "30" });
      if (action) qs.set("action", action);
      const res = await fetch(`/api/audit-logs?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        logs: AuditLog[];
        pagination: { page: number; limit: number; total: number };
      };
    },
  });

  const totalPages = data
    ? Math.ceil(data.pagination.total / data.pagination.limit)
    : 1;

  return (
    <>
      <Topbar title="Audit log" />
      <PageContainer>
        <div className="flex gap-4 mb-6 items-end">
          <div className="space-y-1">
            <Label>Filter by action</Label>
            <Input
              placeholder="e.g. SUBMITTED"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-[240px]"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data?.logs.length ? (
          <EmptyState
            icon={ScrollText}
            title="No audit entries"
            description="Actions on goal sheets and admin changes will appear here."
          />
        ) : (
          <>
            <TableScroll>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => {
                    const hasDetail =
                      log.metadata != null ||
                      log.previousValues != null ||
                      log.newValues != null;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.action}</TableCell>
                        <TableCell>{log.createdBy.name}</TableCell>
                        <TableCell className="text-sm">
                          {log.goalSheet
                            ? `${log.goalSheet.employee.name} (${log.goalSheet.employee.employeeCode})`
                            : log.affectedUser?.name ?? log.entityType}
                        </TableCell>
                        <TableCell>
                          {hasDetail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelected(log)}
                            >
                              Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableScroll>

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}

        <Dialog open={selected != null} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selected?.action} · {selected?.entityType}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DiffBlock label="Previous values" value={selected?.previousValues} />
              <DiffBlock label="New values" value={selected?.newValues} />
              <DiffBlock label="Metadata" value={selected?.metadata} />
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
