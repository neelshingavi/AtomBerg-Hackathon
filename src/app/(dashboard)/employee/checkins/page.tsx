"use client";

import { format } from "date-fns";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { useGoalSheets } from "@/hooks/useGoals";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, StaggerGrid } from "@/components/motion";
import { EmptyState } from "@/components/ui/empty-state";

export default function EmployeeCheckinsPage() {
  const { data, isLoading } = useGoalSheets({ status: "APPROVED" });

  const sheets =
    data?.goalSheets.filter((s) => s.isLocked && s.status === "APPROVED") ?? [];

  return (
    <>
      <Topbar title="Quarterly check-ins" />
      <PageContainer>
        <PageHeader
          title="Check-ins hub"
          description="Log quarterly achievements and view manager feedback on approved goal sheets."
        />

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : sheets.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No approved sheets yet"
            description="Once your manager approves and locks a goal sheet, you can log quarterly achievements here."
          />
        ) : (
          <StaggerGrid className="grid gap-4 sm:grid-cols-2">
            {sheets.map((sheet) => (
              <FadeIn key={sheet.id}>
                <Link href={`/employee/goals/${sheet.id}/checkin`}>
                  <Card className="group transition-all hover:border-brand-300 hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <p className="font-semibold">{sheet.cycle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sheet.goalsCount} goals · {sheet.totalWeightage}% weightage
                        </p>
                        {sheet.approvedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Approved {format(new Date(sheet.approvedAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <GoalStatusBadge status={sheet.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </StaggerGrid>
        )}
      </PageContainer>
    </>
  );
}
