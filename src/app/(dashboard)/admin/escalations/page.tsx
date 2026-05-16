"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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
      const res = await fetch("/api/escalations/logs?limit=30");
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

  return (
    <>
      <Topbar title="Escalations" />
      <PageContainer className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Escalation rules</CardTitle>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Add rule
            </Button>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Notify</TableHead>
                    <TableHead>Logs</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</TableCell>
                      <TableCell>{rule.daysThreshold}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[
                          rule.notifyEmployee && "Employee",
                          rule.notifyManager && "Manager",
                          rule.notifyHR && "HR",
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell>{rule._count.escalationLogs}</TableCell>
                      <TableCell>
                        <Button
                          variant={rule.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            toggleRule.mutate({ id: rule.id, isActive: !rule.isActive })
                          }
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent escalation log</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No escalations logged yet
                      </TableCell>
                    </TableRow>
                  )}
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {log.employee.name}
                        <span className="block text-xs text-muted-foreground font-mono">
                          {log.employee.employeeCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {TRIGGER_LABELS[log.rule.trigger] ?? log.rule.trigger}
                        <span className="text-muted-foreground"> ({log.rule.daysThreshold}d)</span>
                      </TableCell>
                      <TableCell>{log.manager?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
