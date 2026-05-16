"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { GoalSheetForm } from "@/components/goals/GoalSheetForm";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { useGoalSheets } from "@/hooks/useGoals";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button-link";

export default function NewGoalSheetPage() {
  const router = useRouter();
  const { data, isLoading: cycleLoading } = useCurrentCycle();
  const cycle = data?.active;
  const { data: sheetsData, isLoading: sheetsLoading } = useGoalSheets(
    cycle ? { cycleId: cycle.id } : undefined
  );

  const existingDraft = sheetsData?.goalSheets.find((s) =>
    ["DRAFT", "REWORK"].includes(s.status)
  );

  useEffect(() => {
    if (existingDraft) {
      router.replace(`/employee/goals/${existingDraft.id}`);
    }
  }, [existingDraft, router]);

  if (cycleLoading || sheetsLoading || existingDraft) {
    return (
      <>
        <Topbar title="Create goals" />
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </>
    );
  }

  if (!cycle) {
    return (
      <>
        <Topbar title="Create goals" />
        <PageContainer>
          <p className="text-muted-foreground">No active goal cycle configured.</p>
          <ButtonLink className="mt-4" href="/employee/goals">
            Back to goals
          </ButtonLink>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Topbar title="Create goals" />
      <PageContainer>
        <GoalSheetForm cycleId={cycle.id} cycleName={cycle.name} />
      </PageContainer>
    </>
  );
}
