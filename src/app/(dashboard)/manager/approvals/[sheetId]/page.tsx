"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { useApproveGoalSheet, useGoalSheet, useRejectGoalSheet } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { validateSubmission } from "@/lib/calculations/weightage";

export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId as string;
  const { data: sheet, isLoading } = useGoalSheet(sheetId);
  const approve = useApproveGoalSheet();
  const reject = useRejectGoalSheet();

  const [managerNote, setManagerNote] = useState("");
  const [edits, setEdits] = useState<Record<string, { weightage: number; plannedTarget: number }>>({});

  if (isLoading || !sheet) {
    return (
      <>
        <Topbar title="Review goals" />
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </>
    );
  }

  const goalsWithEdits = sheet.goals.map((g) => ({
    ...g,
    weightage: edits[g.id]?.weightage ?? g.weightage,
    plannedTarget: edits[g.id]?.plannedTarget ?? g.plannedTarget,
  }));

  const totalWeightage = goalsWithEdits.reduce((s, g) => s + g.weightage, 0);
  const weightageValid = validateSubmission(
    goalsWithEdits.map((g) => ({ title: g.title, weightage: g.weightage }))
  ).isValid;

  async function handleApprove() {
    if (!weightageValid) {
      toast.error("Total weightage must be 100% with min 10% per goal");
      return;
    }
    try {
      await approve.mutateAsync({
        sheetId,
        managerNote: managerNote || undefined,
        inlineEdits: Object.entries(edits).map(([goalId, v]) => ({
          goalId,
          weightage: v.weightage,
          plannedTarget: v.plannedTarget,
        })),
      });
      toast.success("Goal sheet approved");
      router.push("/manager/approvals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    }
  }

  async function handleReject() {
    if (!managerNote.trim()) {
      toast.error("Please add a note explaining what to rework");
      return;
    }
    try {
      await reject.mutateAsync({ sheetId, managerNote });
      toast.success("Returned for rework");
      router.push("/manager/approvals");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reject failed");
    }
  }

  return (
    <>
      <Topbar title="Review goals" />
      <PageContainer>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-lg font-semibold">{sheet.employee.name}</p>
            <p className="text-sm text-muted-foreground">
              {sheet.employee.employeeCode} · {sheet.employee.department.name}
              {sheet.submittedAt &&
                ` · Submitted ${format(new Date(sheet.submittedAt), "MMM d, yyyy")}`}
            </p>
          </div>
          <GoalStatusBadge status={sheet.status} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Thrust area</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Weightage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sheet.goals.map((g, i) => (
              <TableRow key={g.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{g.thrustArea.name}</TableCell>
                <TableCell className="font-medium">{g.title}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-24"
                    defaultValue={g.plannedTarget}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [g.id]: {
                          weightage: prev[g.id]?.weightage ?? g.weightage,
                          plannedTarget: Number(e.target.value),
                        },
                      }))
                    }
                  />
                  <span className="ml-1 text-xs text-muted-foreground">{g.unit}</span>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-20"
                    defaultValue={g.weightage}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [g.id]: {
                          plannedTarget: prev[g.id]?.plannedTarget ?? g.plannedTarget,
                          weightage: Number(e.target.value),
                        },
                      }))
                    }
                  />
                  %
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className={`mt-2 text-sm ${weightageValid ? "text-emerald-600" : "text-red-600"}`}>
          Total weightage: {totalWeightage}% {weightageValid ? "✓" : "— must be 100%"}
        </p>

        <div className="mt-6 space-y-2 max-w-xl">
          <Label>Manager note</Label>
          <Textarea
            rows={3}
            value={managerNote}
            onChange={(e) => setManagerNote(e.target.value)}
            placeholder="Optional feedback for the employee"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <ButtonLink variant="outline" href="/manager/approvals">
            Back
          </ButtonLink>
          <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
            Return for rework
          </Button>
          <Button onClick={handleApprove} disabled={approve.isPending || !weightageValid}>
            Approve & lock
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
