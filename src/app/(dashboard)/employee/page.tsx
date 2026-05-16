import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { EmployeeDashboardClient } from "@/app/(dashboard)/employee/employee-dashboard-client";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PageHeader } from "@/components/ui/page-header";
import { ActionCard } from "@/components/ui/action-card";
import { Target, Scale, FileCheck, CalendarDays, PenLine, ClipboardCheck } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

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
        <PageHeader
          title={`Hello, ${session.user.name?.split(" ")[0] ?? "there"}`}
          description="Track your goals, submit for approval, and log quarterly achievements."
        />

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

        <DashboardStats
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          items={[
            {
              label: "My goals",
              value: `${sheet?.goals.length ?? 0} / 8`,
              hint: "Maximum per sheet",
              icon: Target,
              accent: "info",
            },
            {
              label: "Weightage",
              value: `${totalWeightage}%`,
              hint: totalWeightage === 100 ? "Ready to submit" : "Target 100%",
              icon: Scale,
              accent: totalWeightage === 100 ? "success" : "warning",
            },
            {
              label: "Status",
              value: sheet ? <GoalStatusBadge status={sheet.status} /> : "No sheet",
              icon: FileCheck,
              accent: "neutral",
            },
            {
              label: "Active cycle",
              value: cycle?.name ?? "—",
              hint: cycle?.fiscalYear,
              icon: CalendarDays,
              accent: "default",
            },
          ]}
        />

        {!sheet && cycle && (
          <FadeIn>
            <ActionCard
              href="/employee/goals/new"
              title="Create your goal sheet"
              description={`Start building goals for ${cycle.name} before the window closes.`}
              icon={PenLine}
              variant="primary"
            />
          </FadeIn>
        )}

        {sheet && ["DRAFT", "REWORK"].includes(sheet.status) && (
          <FadeIn className="mt-4">
            <ActionCard
              href={`/employee/goals/${sheet.id}`}
              title="Continue editing"
              description="Your goal sheet is in draft — complete and submit for manager approval."
              icon={PenLine}
              variant="warning"
            />
          </FadeIn>
        )}

        {sheet?.status === "APPROVED" && sheet.isLocked && (
          <FadeIn className="mt-4">
            <ActionCard
              href="/employee/checkins"
              title="Quarterly check-in"
              description="Log achievements and progress for your approved goals."
              icon={ClipboardCheck}
              variant="success"
            />
          </FadeIn>
        )}

        <div className="mt-8">
          <ActivityFeed limit={6} />
        </div>
      </PageContainer>
    </>
  );
}
