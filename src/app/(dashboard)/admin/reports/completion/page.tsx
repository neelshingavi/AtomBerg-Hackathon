"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

type CompletionData = {
  cycle: { name: string; currentPhase: string };
  goalSetting: {
    totalEmployees: number;
    submitted: number;
    approved: number;
    pending: number;
    submissionRate: number;
    approvalRate: number;
  };
  byDepartment: Array<{
    department: string;
    totalEmployees: number;
    approved: number;
    completionRate: number;
  }>;
};

export default function CompletionReportPage() {
  const [cycleId, setCycleId] = useState("");

  const { data: cycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      return json.data.cycles as Array<{ id: string; name: string; isActive: boolean }>;
    },
  });

  const activeCycleId = cycleId || cycles?.find((c) => c.isActive)?.id || "";

  const { data, isLoading } = useQuery({
    queryKey: ["report", "completion", activeCycleId],
    enabled: !!activeCycleId,
    queryFn: async () => {
      const res = await fetch(`/api/reports/completion?cycleId=${activeCycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as CompletionData;
    },
  });

  const gs = data?.goalSetting;

  return (
    <>
      <Topbar title="Completion dashboard" />
      <PageContainer>
        <div className="mb-6 space-y-1 w-[220px]">
          <Label>Cycle</Label>
          <Select
            value={activeCycleId}
            onValueChange={(v) => v && setCycleId(v)}
          >
            <SelectTrigger>
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

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : data && gs ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{gs.totalEmployees}</p>
                  <p className="text-xs text-muted-foreground">{data.cycle.currentPhase}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{gs.submitted}</p>
                  <p className="text-xs text-muted-foreground">{gs.submissionRate}% rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{gs.approved}</p>
                  <p className="text-xs text-muted-foreground">{gs.approvalRate}% of submitted</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{gs.pending}</p>
                  <p className="text-xs text-muted-foreground">Not yet submitted</p>
                </CardContent>
              </Card>
            </div>

            <h3 className="font-semibold mb-4">By department</h3>
            <div className="space-y-4">
              {data.byDepartment.map((dept) => (
                <Card key={dept.department}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{dept.department}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Approved sheets</span>
                      <span>
                        {dept.approved}/{dept.totalEmployees} ({dept.completionRate}%)
                      </span>
                    </div>
                    <Progress value={dept.completionRate} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </PageContainer>
    </>
  );
}
