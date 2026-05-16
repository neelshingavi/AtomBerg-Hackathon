"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Cycle = {
  id: string;
  name: string;
  fiscalYear: string;
  isActive: boolean;
  currentPhase: string;
  goalSettingStart: string;
  goalSettingEnd: string;
};

const PHASES = [
  "GOAL_SETTING",
  "Q1_CHECKIN",
  "Q2_CHECKIN",
  "Q3_CHECKIN",
  "Q4_ANNUAL",
  "CLOSED",
] as const;

export default function AdminCyclesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    fiscalYear: "FY2026-27",
    goalSettingStart: "2026-04-01",
    goalSettingEnd: "2026-06-30",
    q1WindowStart: "2026-05-01",
    q1WindowEnd: "2026-05-31",
    q2WindowStart: "2026-08-01",
    q2WindowEnd: "2026-08-31",
    q3WindowStart: "2026-11-01",
    q3WindowEnd: "2026-11-30",
    q4WindowStart: "2027-02-01",
    q4WindowEnd: "2027-03-31",
  });

  const { data: cycles, isLoading } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.cycles as Cycle[];
    },
  });

  const createCycle = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Cycle created");
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ["cycles"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const activateCycle = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cycles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      toast.success("Cycle activated");
      void qc.invalidateQueries({ queryKey: ["cycles"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, currentPhase }: { id: string; currentPhase: string }) => {
      const res = await fetch(`/api/cycles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPhase }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cycles"] }),
  });

  return (
    <>
      <Topbar title="Goal cycles" />
      <PageContainer>
        <div className="flex justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Create fiscal-year cycles and set the active cycle for the organization.
          </p>
          <Button onClick={() => setCreateOpen(true)}>New cycle</Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="grid gap-4">
            {cycles?.map((cycle) => (
              <Card key={cycle.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{cycle.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{cycle.fiscalYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cycle.isActive && <Badge>Active</Badge>}
                    <Badge variant="outline">{cycle.currentPhase.replace(/_/g, " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Goal setting: {format(new Date(cycle.goalSettingStart), "dd MMM yyyy")} –{" "}
                    {format(new Date(cycle.goalSettingEnd), "dd MMM yyyy")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!cycle.isActive && (
                      <Button
                        size="sm"
                        onClick={() => activateCycle.mutate(cycle.id)}
                        disabled={activateCycle.isPending}
                      >
                        Set active
                      </Button>
                    )}
                    <Select
                      value={cycle.currentPhase}
                      onValueChange={(v) => {
                        if (v) updatePhase.mutate({ id: cycle.id, currentPhase: v });
                      }}
                    >
                      <SelectTrigger className="w-[200px] h-9">
                        <SelectValue placeholder="Phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create goal cycle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="FY 2026-27"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fiscal year</Label>
                  <Input
                    value={form.fiscalYear}
                    onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}
                  />
                </div>
              </div>
              {(
                [
                  ["goalSettingStart", "Goal setting start"],
                  ["goalSettingEnd", "Goal setting end"],
                  ["q1WindowStart", "Q1 window start"],
                  ["q1WindowEnd", "Q1 window end"],
                  ["q2WindowStart", "Q2 window start"],
                  ["q2WindowEnd", "Q2 window end"],
                  ["q3WindowStart", "Q3 window start"],
                  ["q3WindowEnd", "Q3 window end"],
                  ["q4WindowStart", "Q4 window start"],
                  ["q4WindowEnd", "Q4 window end"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type="date"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createCycle.mutate()} disabled={createCycle.isPending}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
