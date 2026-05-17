"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Zap, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DataTable, DataTableSortHeader } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  delayMinutes: number;
  _count: { runs: number };
};

const TRIGGERS = [
  "GOAL_SUBMITTED",
  "APPROVAL_DELAYED",
  "CHECKIN_MISSED",
  "HIGH_RISK",
  "COMPLETION_MILESTONE",
  "INACTIVE_EMPLOYEE",
];

export default function AutomationPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "GOAL_SUBMITTED",
    delayMinutes: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const res = await fetch("/api/automation/rules");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.rules as Rule[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          trigger: form.trigger,
          delayMinutes: form.delayMinutes,
          conditions: {},
          actions: [
            {
              type: "notify",
              config: {
                role: "manager",
                title: "Automation triggered",
                message: `Rule "${form.name}" fired.`,
                link: "/manager/approvals",
              },
            },
            { type: "teams", config: { title: form.name, message: "Workflow automation executed.", link: "/admin/automation" } },
          ],
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Automation rule created");
      setOpen(false);
      setForm({ name: "", trigger: "GOAL_SUBMITTED", delayMinutes: 0 });
      void qc.invalidateQueries({ queryKey: ["automation-rules"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/automation/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  const columns: ColumnDef<Rule>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableSortHeader column={column} title="Rule" />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: "trigger", header: "Trigger" },
    { accessorKey: "delayMinutes", header: "Delay (min)" },
    {
      accessorKey: "_count.runs",
      header: "Runs",
      cell: ({ row }) => row.original._count.runs,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Paused"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggle.mutate({ id: row.original.id, isActive: !row.original.isActive })}
        >
          {row.original.isActive ? "Pause" : "Enable"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Topbar title="Workflow automation" />
      <PageContainer data-spotlight="automation">
        <PageHeader
          title="Automation builder"
          description="Zapier-style rules: triggers, conditions, and multi-channel actions."
          actions={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New rule
            </Button>
          }
        />

        <Card className="enterprise-card mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-600" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Choose a trigger (submission, delayed approval, missed check-in, etc.)</p>
            <p>2. Set optional delay and conditions</p>
            <p>3. Actions run automatically: in-app notify, email, Teams, audit log</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DataTable columns={columns} data={data ?? []} pageSize={10} />
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create automation rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Trigger</Label>
                <Select value={form.trigger} onValueChange={(v) => v && setForm({ ...form, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Delay (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.delayMinutes}
                  onChange={(e) => setForm({ ...form, delayMinutes: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
