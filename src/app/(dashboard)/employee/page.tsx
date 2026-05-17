import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { calculateProgress, calculateSheetScore } from "@/lib/calculations/progress";
import { EmployeeDashboardView } from "@/components/dashboard/employee/EmployeeDashboardView";

export default async function EmployeeDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cycle = await getActiveCycle();
  const activeQuarter = (cycle ? getActiveQuarter(cycle) : null) ?? "Q1";

  const sheet = cycle
    ? await prisma.goalSheet.findUnique({
        where: {
          employeeId_cycleId: { employeeId: session.user.id, cycleId: cycle.id },
        },
        include: {
          goals: {
            include: { achievements: true, thrustArea: true },
            orderBy: { order: "asc" },
          },
        },
      })
    : null;

  const sharedGoalsCount = sheet
    ? await prisma.goal.count({
        where: { goalSheetId: sheet.id, isShared: true },
      })
    : 0;

  const goals = sheet?.goals ?? [];
  const goalsForProgress = goals.map((g) => ({
    weightage: g.weightage,
    achievements: g.achievements.map((a) => ({
      quarter: a.quarter,
      progressScore: a.progressScore,
    })),
  }));

  const quarterlyPct = Math.round(
    calculateSheetScore(goalsForProgress, activeQuarter) * 100
  );

  let completionPct = 0;
  if (goals.length > 0) {
    const scores = goals.map((g) => {
      const latest = g.achievements
        .filter((a) => a.progressScore != null)
        .sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
      if (!latest?.progressScore) return 0;
      return latest.progressScore * 100 * (g.weightage / 100);
    });
    completionPct = Math.round(scores.reduce((a, b) => a + b, 0));
  }

  const goalProgress = goals.map((g) => {
    const ach = g.achievements.find((a) => a.quarter === activeQuarter);
    let progressPct = 0;
    if (ach?.actualValue != null) {
      progressPct = calculateProgress({
        uomType: g.uomType,
        plannedTarget: g.plannedTarget,
        actualValue: ach.actualValue,
        targetDeadline: g.targetDeadline,
        completionDate: ach.completionDate,
      }).percentage;
    } else if (ach?.progressScore != null) {
      progressPct = Math.round(ach.progressScore * 100);
    }
    return { id: g.id, title: g.title, weightage: g.weightage, progressPct };
  });

  const upcomingActions: Array<{
    id: string;
    type: "checkin" | "deadline" | "rejected" | "escalation";
    title: string;
    description: string;
    href: string;
    severity?: "low" | "medium" | "critical";
  }> = [];

  if (sheet?.status === "REJECTED" || sheet?.status === "REWORK") {
    upcomingActions.push({
      id: "rework",
      type: "rejected",
      title: "Goal sheet needs revision",
      description: "Your manager returned your sheet for updates.",
      href: `/employee/goals/${sheet.id}`,
      severity: "medium",
    });
  }

  if (sheet?.status === "APPROVED" && sheet.isLocked) {
    const missingCheckin = goals.some(
      (g) => !g.achievements.some((a) => a.quarter === activeQuarter && a.actualValue != null)
    );
    if (missingCheckin) {
      upcomingActions.push({
        id: "checkin",
        type: "checkin",
        title: `${activeQuarter} check-in due`,
        description: "Log achievements for this quarter.",
        href: "/employee/checkins",
        severity: "low",
      });
    }
  }

  const now = Date.now();
  for (const g of goals) {
    if (g.targetDeadline && new Date(g.targetDeadline).getTime() - now < 30 * 86400000) {
      upcomingActions.push({
        id: `deadline-${g.id}`,
        type: "deadline",
        title: `Deadline: ${g.title}`,
        description: `Target due ${new Date(g.targetDeadline).toLocaleDateString()}`,
        href: sheet ? `/employee/goals/${sheet.id}` : "/employee/goals",
        severity: "medium",
      });
    }
  }

  const achievementsByQuarter: Record<string, number> = {};
  for (const q of ["Q1", "Q2", "Q3", "Q4"]) {
    achievementsByQuarter[q] = goals.filter((g) =>
      g.achievements.some((a) => a.quarter === q && a.actualValue != null)
    ).length;
  }

  return (
    <>
      <Topbar title="Execution Hub" />
      <PageContainer>
        <EmployeeDashboardView
          firstName={session.user.name?.split(" ")[0] ?? "there"}
          cycleName={cycle?.name}
          fiscalYear={cycle?.fiscalYear}
          sheetStatus={sheet?.status ?? null}
          completionPct={Math.min(100, completionPct)}
          quarterlyPct={Math.min(100, quarterlyPct)}
          quarterlyLabel={`${activeQuarter} progress`}
          goalSheetId={sheet?.id}
          goalsCount={goals.length}
          achievementsByQuarter={achievementsByQuarter}
          goals={goalsForProgress}
          openQuarter={activeQuarter}
          kpis={{
            goalsSubmitted: goals.length,
            pendingReviews: sheet?.status === "SUBMITTED" || sheet?.status === "UNDER_REVIEW" ? 1 : 0,
            sharedGoals: sharedGoalsCount,
            upcomingDeadlines: upcomingActions.filter((a) => a.type === "deadline").length,
          }}
          goalProgress={goalProgress}
          upcomingActions={upcomingActions.slice(0, 6)}
        />
      </PageContainer>
    </>
  );
}
