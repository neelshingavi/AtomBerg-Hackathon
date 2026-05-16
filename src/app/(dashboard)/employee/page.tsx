import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { ButtonLink } from "@/components/ui/button-link";
import { EmployeeDashboardClient } from "@/app/(dashboard)/employee/employee-dashboard-client";

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cycle = await getActiveCycle();
  const sheet = cycle
    ? await prisma.goalSheet.findUnique({
        where: {
          employeeId_cycleId: { employeeId: session.user.id, cycleId: cycle.id },
        },
        include: {
          goals: {
            include: { achievements: true },
            orderBy: { order: "asc" },
          },
        },
      })
    : null;

  const totalWeightage = sheet?.goals.reduce((s, g) => s + g.weightage, 0) ?? 0;
  const activeQuarter = cycle ? getActiveQuarter(cycle) : null;

  const achievementsByQuarter: Record<string, number> = {};
  if (sheet) {
    for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
      achievementsByQuarter[q] = sheet.goals.filter((g) =>
        g.achievements.some((a) => a.quarter === q && a.actualValue != null)
      ).length;
    }
  }

  return (
    <>
      <Topbar title="Dashboard" />
      <PageContainer>
        <EmployeeDashboardClient
          goalSheetId={sheet?.id}
          goalsCount={sheet?.goals.length}
          achievementsByQuarter={achievementsByQuarter}
          goals={
            sheet?.goals.map((g) => ({
              weightage: g.weightage,
              achievements: g.achievements.map((a) => ({
                quarter: a.quarter,
                progressScore: a.progressScore,
              })),
            })) ?? []
          }
          openQuarter={activeQuarter}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{sheet?.goals.length ?? 0} / 8</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weightage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalWeightage}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {sheet ? <GoalStatusBadge status={sheet.status} /> : <span className="text-sm">No sheet</span>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{cycle?.name ?? "—"}</p>
            </CardContent>
          </Card>
        </div>

        {!sheet && cycle && (
          <Card className="border-dashed">
            <CardContent className="py-8 flex flex-col items-center gap-4">
              <p className="text-muted-foreground">You have not created goals for {cycle.name} yet.</p>
              <ButtonLink href="/employee/goals/new">Create goal sheet</ButtonLink>
            </CardContent>
          </Card>
        )}

        {sheet && ["DRAFT", "REWORK"].includes(sheet.status) && (
          <Card className="mt-4">
            <CardContent className="py-4 flex items-center justify-between">
              <p className="text-sm">Continue editing your goal sheet.</p>
              <ButtonLink href={`/employee/goals/${sheet.id}`}>Edit goals</ButtonLink>
            </CardContent>
          </Card>
        )}

        {sheet?.status === "APPROVED" && sheet.isLocked && (
          <Card className="mt-4">
            <CardContent className="py-4 flex items-center justify-between">
              <p className="text-sm">Log quarterly achievements for your approved goals.</p>
              <ButtonLink href={`/employee/goals/${sheet.id}/checkin`}>Open check-ins</ButtonLink>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
