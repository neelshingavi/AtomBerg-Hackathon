import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { calculateSheetScore } from "@/lib/calculations/progress";
import { AdminDashboardView } from "@/components/dashboard/admin/AdminDashboardView";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cycle = await getActiveCycle();
  const activeQuarter = (cycle ? getActiveQuarter(cycle) : null) ?? "Q1";

  const [
    employees,
    managers,
    pending,
    activeEscalations,
    lockedGoals,
    recentAudits,
    escalationByRule,
    approvedSheets,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
    prisma.user.count({ where: { role: "MANAGER", isActive: true } }),
    prisma.goalSheet.count({ where: { status: "SUBMITTED" } }),
    prisma.escalationLog.count({
      where: { status: { in: ["PENDING", "NOTIFIED", "ESCALATED"] } },
    }),
    prisma.goalSheet.count({ where: { isLocked: true } }),
    prisma.auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    prisma.escalationLog.groupBy({
      by: ["ruleId"],
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    }),
    cycle
      ? prisma.goalSheet.findMany({
          where: { cycleId: cycle.id, status: "APPROVED" },
          include: { goals: { include: { achievements: true } } },
        })
      : Promise.resolve([]),
    prisma.session.count({
      where: { expires: { gt: new Date() } },
    }),
  ]);

  let orgTotal = 0;
  let compliant = 0;
  for (const sheet of approvedSheets) {
    const goalsData = sheet.goals.map((g) => ({
      weightage: g.weightage,
      achievements: g.achievements.map((a) => ({
        quarter: a.quarter,
        progressScore: a.progressScore,
      })),
    }));
    const pct = calculateSheetScore(goalsData, activeQuarter) * 100;
    orgTotal += pct;
    if (
      sheet.goals.every((g) =>
        g.achievements.some((a) => a.quarter === activeQuarter && a.actualValue != null)
      )
    ) {
      compliant++;
    }
  }

  const orgCompletionPct =
    approvedSheets.length > 0 ? Math.round(orgTotal / approvedSheets.length) : 0;
  const checkinCompliance =
    approvedSheets.length > 0
      ? Math.round((compliant / approvedSheets.length) * 100)
      : 100;

  const rules = await prisma.escalationRule.findMany({
    where: { id: { in: escalationByRule.map((e) => e.ruleId) } },
    select: { id: true, trigger: true },
  });
  const ruleMap = Object.fromEntries(
    rules.map((r) => [r.id, r.trigger.replace(/_/g, " ")])
  );

  const escalationTrend = escalationByRule
    .map((e) => ({
      label: ruleMap[e.ruleId] ?? "Unknown",
      count: e._count.id,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const delayedManagers = await prisma.goalSheet.count({
    where: { status: "SUBMITTED", submittedAt: { lt: new Date(Date.now() - 5 * 86400000) } },
  });

  return (
    <>
      <Topbar title="Admin dashboard" />
      <PageContainer>
        <AdminDashboardView
          orgCompletionPct={orgCompletionPct}
          activeEscalations={activeEscalations}
          delayedManagers={delayedManagers}
          checkinCompliance={checkinCompliance}
          lockedGoals={lockedGoals}
          unresolvedAudits={recentAudits}
          employees={employees}
          managers={managers}
          pendingApprovals={pending}
          escalationTrend={escalationTrend}
          systemHealth={{
            activeUsers: activeUsers,
            apiHealth: "healthy",
            backgroundJobs: "Running",
            notifications: "Delivering",
          }}
        />
      </PageContainer>
    </>
  );
}
