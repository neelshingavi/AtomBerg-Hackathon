"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { GoalTable } from "@/components/goals/GoalTable";
import { ButtonLink } from "@/components/ui/button-link";
import { useGoalSheets } from "@/hooks/useGoals";

export default function EmployeeGoalsPage() {
  const { data, isLoading } = useGoalSheets();

  return (
    <>
      <Topbar title="My Goals" />
      <PageContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <p className="text-sm text-muted-foreground">All goal sheets across cycles</p>
          <ButtonLink href="/employee/goals/new">New goal sheet</ButtonLink>
        </div>

        <GoalTable sheets={data?.goalSheets ?? []} isLoading={isLoading} />
      </PageContainer>
    </>
  );
}
