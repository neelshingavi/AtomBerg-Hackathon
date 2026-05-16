"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { GoalSheetForm, type GoalFormGoal } from "@/components/goals/GoalSheetForm";
import { useGoalSheet } from "@/hooks/useGoals";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { UnlockGoalSheetDialog } from "@/components/admin/UnlockGoalSheetDialog";
import { useState } from "react";

function mapGoalsToForm(goals: NonNullable<ReturnType<typeof useGoalSheet>["data"]>["goals"]): GoalFormGoal[] {
  return goals.map((g) => ({
    id: g.id,
    thrustAreaId: g.thrustArea.id,
    title: g.title,
    description: g.description ?? "",
    uomType: g.uomType as GoalFormGoal["uomType"],
    plannedTarget: g.plannedTarget,
    targetDeadline: g.targetDeadline?.slice(0, 10) ?? "",
    unit: g.unit ?? "",
    weightage: g.weightage,
    isShared: g.isShared,
    isTitleLocked: g.isTitleLocked,
    isTargetLocked: g.isTargetLocked,
  }));
}

export default function GoalDetailPage() {
  const params = useParams();
  const sheetId = params.goalId as string;
  const { data: session } = useSession();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { data: sheet, isLoading, refetch } = useGoalSheet(sheetId);
  const isAdmin = session?.user?.role === "ADMIN";

  const editable = sheet && ["DRAFT", "REWORK"].includes(sheet.status);

  if (isLoading) {
    return (
      <>
        <Topbar title="Goal sheet" />
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </>
    );
  }

  if (!sheet) {
    return (
      <>
        <Topbar title="Goal sheet" />
        <PageContainer>
          <p>Goal sheet not found.</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Topbar title={editable ? "Edit goal sheet" : "Goal sheet"} />
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GoalStatusBadge status={sheet.status} />
            <span className="text-sm text-muted-foreground">{sheet.cycle.name}</span>
            {sheet.isLocked && (
              <span className="text-xs text-muted-foreground">Locked</span>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && sheet.isLocked && (
              <Button variant="destructive" onClick={() => setUnlockOpen(true)}>
                Unlock sheet
              </Button>
            )}
            <ButtonLink variant="outline" href="/employee/goals">
              Back to list
            </ButtonLink>
          </div>
        </div>

        {editable && sheet.status === "REWORK" && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="py-3 text-sm text-orange-800">
              Your manager returned this sheet for rework. Adjust weightage on shared goals if
              needed, then resubmit.
            </CardContent>
          </Card>
        )}

        {editable ? (
          <GoalSheetForm
            cycleId={sheet.cycle.id}
            cycleName={sheet.cycle.name}
            existingSheetId={sheetId}
            initialGoals={
              sheet.goals.length > 0 ? mapGoalsToForm(sheet.goals) : undefined
            }
            onSaved={() => void refetch()}
          />
        ) : (
          <>
            {sheet.status === "APPROVED" && sheet.isLocked && (
              <div className="mb-4">
                <ButtonLink href={`/employee/goals/${sheetId}/checkin`}>
                  Quarterly check-in
                </ButtonLink>
              </div>
            )}
            <GoalSheetForm
              cycleId={sheet.cycle.id}
              cycleName={sheet.cycle.name}
              existingSheetId={sheetId}
              initialGoals={mapGoalsToForm(sheet.goals)}
              readOnly
            />
          </>
        )}

        {isAdmin && (
          <UnlockGoalSheetDialog
            sheetId={sheetId}
            open={unlockOpen}
            onOpenChange={setUnlockOpen}
            onUnlocked={() => void refetch()}
          />
        )}
      </PageContainer>
    </>
  );
}
