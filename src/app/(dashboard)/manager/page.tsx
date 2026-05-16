import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { calculateSheetScore } from "@/lib/calculations/progress";
import { ManagerDashboardView } from "@/components/dashboard/manager/ManagerDashboardView";

export default async function ManagerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cycle = await getActiveCycle();
  const activeQuarter = (cycle ? getActiveQuarter(cycle) : null) ?? "Q1";

  const [pendingSheets, teamMembers, escalationCount] = await Promise.all([
    prisma.goalSheet.findMany({
      where: { managerId: session.user.id, status: "SUBMITTED" },
      include: {
        employee: { include: { department: true } },
        cycle: true,
        _count: { select: { goals: true } },
      },
      orderBy: { submittedAt: "asc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { managerId: session.user.id, isActive: true, role: "EMPLOYEE" },
      include: {
        goalSheets: {
          where: cycle ? { cycleId: cycle.id } : undefined,
          include: { goals: { include: { achievements: true } } },
        },
      },
    }),
    prisma.escalationLog.count({
      where: {
        status: { in: ["PENDING", "NOTIFIED", "ESCALATED"] },
        managerId: session.user.id,
      },
    }),
  ]);

  const approvals = pendingSheets.map((s) => ({
    id: s.id,
    employeeName: s.employee.name,
    employeeCode: s.employee.employeeCode ?? "",
    department: s.employee.department.name,
    cycle: s.cycle.name,
    goalsCount: s._count.goals,
    submittedAt: s.submittedAt?.toISOString() ?? null,
  }));

  const teamProgress: { name: string; pct: number }[] = [];
  let totalPct = 0;
  let delayedCheckins = 0;
  const atRiskEmployees: Array<{
    id: string;
    name: string;
    reason: string;
    severity: "low" | "medium" | "critical";
  }> = [];

  for (const member of teamMembers) {
    const sheet = member.goalSheets[0] ?? null;
    let pct = 0;
    if (sheet?.goals?.length) {
      const goalsData = sheet.goals.map((g) => ({
        weightage: g.weightage,
        achievements: g.achievements.map((a) => ({
          quarter: a.quarter,
          progressScore: a.progressScore,
        })),
      }));
      pct = Math.round(calculateSheetScore(goalsData, activeQuarter) * 100);
    }
    teamProgress.push({ name: member.name, pct });
    totalPct += pct;

    if (sheet?.status === "SUBMITTED") {
      atRiskEmployees.push({
        id: member.id,
        name: member.name,
        reason: "Pending your approval",
        severity: "medium",
      });
    } else if (pct < 30 && sheet?.status === "APPROVED") {
      atRiskEmployees.push({
        id: member.id,
        name: member.name,
        reason: "Low quarterly progress",
        severity: pct < 15 ? "critical" : "low",
      });
    }

    if (sheet?.status === "APPROVED") {
      const missing = sheet.goals.some(
        (g) =>
          !g.achievements.some(
            (a) => a.quarter === activeQuarter && a.actualValue != null
          )
      );
      if (missing) delayedCheckins++;
    }
  }

  const teamCompletionPct =
    teamMembers.length > 0 ? Math.round(totalPct / teamMembers.length) : 0;

  return (
    <>
      <Topbar title="Manager dashboard" />
      <PageContainer>
        <ManagerDashboardView
          pendingApprovals={pendingSheets.length}
          delayedCheckins={delayedCheckins}
          teamCompletionPct={teamCompletionPct}
          atRiskCount={atRiskEmployees.length}
          escalationCount={escalationCount}
          approvals={approvals}
          atRiskEmployees={atRiskEmployees.slice(0, 8)}
          teamProgress={teamProgress}
        />
      </PageContainer>
    </>
  );
}
