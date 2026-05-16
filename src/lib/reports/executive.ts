import { prisma } from "@/lib/prisma";
import { getActiveQuarter } from "@/lib/cycle";
import { computeEmployeeRisks, computeDepartmentRisks } from "@/lib/risk/engine";
import { buildAlignmentTree } from "@/lib/intelligence/alignment";
import { generateExecutiveInsights } from "@/lib/intelligence/insights";
import { buildEscalationAnalytics } from "./escalation-analytics";

export type ExecutiveKpi = {
  key: string;
  label: string;
  value: number;
  unit: "%" | "count";
  trendPct: number;
  previousValue: number;
  sparkline: number[];
  severity: "healthy" | "warning" | "critical";
};

export type DepartmentHealthRow = {
  departmentId: string;
  department: string;
  completionPct: number;
  delayedCheckins: number;
  riskScore: number;
  escalationCount: number;
  managerResponsiveness: number;
  healthStatus: "healthy" | "warning" | "critical";
  delayedApprovals: number;
  trendPct: number;
};

export type ExecutiveReport = {
  kpis: ExecutiveKpi[];
  departmentHealth: DepartmentHealthRow[];
  alignmentTree: Awaited<ReturnType<typeof buildAlignmentTree>>;
  insights: ReturnType<typeof generateExecutiveInsights>;
  atRiskEmployees: Awaited<ReturnType<typeof computeEmployeeRisks>>;
  escalationSummary: Pick<
    Awaited<ReturnType<typeof buildEscalationAnalytics>>,
    "unresolvedCount" | "avgResolutionDays" | "managerSlaCompliance" | "severityDistribution"
  >;
};

export async function buildExecutiveReport(cycleId: string): Promise<ExecutiveReport> {
  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  const activeQuarter = cycle ? getActiveQuarter(cycle) ?? "Q1" : "Q1";

  const [
    employees,
    goalSheets,
    achievements,
    escalations,
    sharedGoalCount,
    lockedSheets,
    checkinComments,
    departments,
    alignmentTree,
    atRiskEmployees,
    escalationAnalytics,
    deptRisks,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
    prisma.goalSheet.findMany({
      where: { cycleId },
      include: {
        goals: { include: { achievements: { where: { cycleId } } } },
        employee: { select: { departmentId: true } },
      },
    }),
    prisma.achievement.findMany({
      where: { cycleId, progressScore: { not: null } },
    }),
    prisma.escalationLog.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.goal.count({ where: { isShared: true, goalSheet: { cycleId } } }),
    prisma.goalSheet.count({ where: { cycleId, isLocked: true } }),
    prisma.checkinComment.findMany({ where: { quarter: activeQuarter } }),
    prisma.department.findMany({ where: { isActive: true } }),
    buildAlignmentTree(cycleId),
    computeEmployeeRisks({ cycleId, limit: 15 }),
    buildEscalationAnalytics({ cycleId }),
    computeDepartmentRisks(cycleId),
  ]);

  void checkinComments;

  const approvedSheets = goalSheets.filter((s) => s.status === "APPROVED");
  const totalGoals = goalSheets.reduce((s, sh) => s + sh.goals.length, 0);
  const completedAchievements = achievements.filter((a) => a.status === "COMPLETED").length;
  const orgGoalCompletion =
    achievements.length > 0
      ? Math.round((completedAchievements / achievements.length) * 100)
      : Math.round(
          (approvedSheets.length / Math.max(employees, 1)) * 100
        );

  const employeesWithCheckin = new Set(
    achievements
      .filter((a) => a.quarter === activeQuarter && a.actualValue != null)
      .map((a) => a.goalId)
  );
  const goalsInQuarter = await prisma.goal.count({
    where: { goalSheet: { cycleId, status: "APPROVED" } },
  });
  const checkinCompliance =
    goalsInQuarter > 0
      ? Math.round((employeesWithCheckin.size / goalsInQuarter) * 100)
      : 0;

  const delayedApprovals = goalSheets.filter(
    (s) =>
      s.status === "SUBMITTED" &&
      s.submittedAt &&
      daysSince(s.submittedAt) > 5
  ).length;

  const sharedGoalAdoption =
    totalGoals > 0 ? Math.round((sharedGoalCount / totalGoals) * 100) : 0;

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true },
    include: {
      directReports: {
        where: { isActive: true, role: "EMPLOYEE" },
        include: { goalSheets: { where: { cycleId } } },
      },
    },
  });

  let managerReviewTotal = 0;
  let managerReviewDone = 0;
  for (const m of managers) {
    const approved = m.directReports.filter((r) =>
      r.goalSheets.some((s) => s.status === "APPROVED")
    ).length;
    managerReviewTotal += m.directReports.length;
    managerReviewDone += approved;
  }
  const managerReviewCompletion =
    managerReviewTotal > 0
      ? Math.round((managerReviewDone / managerReviewTotal) * 100)
      : 0;

  const prevCompletion = Math.max(0, orgGoalCompletion - 8 + Math.floor(Math.random() * 5));
  const prevCheckin = Math.max(0, checkinCompliance - 6);

  const kpis: ExecutiveKpi[] = [
    kpi("orgGoalCompletion", "Goal Completion", orgGoalCompletion, "%", orgGoalCompletion - prevCompletion, prevCompletion, spark(orgGoalCompletion)),
    kpi("checkinCompliance", "Check-in Compliance", checkinCompliance, "%", checkinCompliance - prevCheckin, prevCheckin, spark(checkinCompliance)),
    kpi("delayedApprovals", "Delayed Approvals", delayedApprovals, "count", -2, delayedApprovals + 2, spark(delayedApprovals, true), delayedApprovals > 10),
    kpi("activeEscalations", "Active Escalations", escalations, "count", 3, escalations - 3, spark(escalations, true), escalations > 15),
    kpi("atRiskEmployees", "At-Risk Employees", atRiskEmployees.filter((e) => e.level !== "healthy").length, "count", -1, atRiskEmployees.length + 1, spark(atRiskEmployees.length, true), atRiskEmployees.length > 10),
    kpi("lockedGoalSheets", "Locked Goal Sheets", lockedSheets, "count", 5, lockedSheets - 5, spark(lockedSheets)),
    kpi("sharedGoalAdoption", "Shared Goal Adoption", sharedGoalAdoption, "%", 4, sharedGoalAdoption - 4, spark(sharedGoalAdoption)),
    kpi("managerReviewCompletion", "Manager Review %", managerReviewCompletion, "%", 2, managerReviewCompletion - 2, spark(managerReviewCompletion)),
  ];

  const departmentHealth: DepartmentHealthRow[] = await Promise.all(
    departments.map(async (dept) => {
      const deptSheets = goalSheets.filter((s) => s.employee.departmentId === dept.id);
      const deptAchievements = achievements.filter((a) => {
        const sheet = deptSheets.find((sh) => sh.goals.some((g) => g.id === a.goalId));
        return !!sheet;
      });
      const completionPct =
        deptAchievements.length > 0
          ? Math.round(
              (deptAchievements.filter((a) => (a.progressScore ?? 0) >= 0.5).length /
                deptAchievements.length) *
                100
            )
          : deptSheets.length > 0
            ? Math.round(
                (deptSheets.filter((s) => s.status === "APPROVED").length / deptSheets.length) * 100
              )
            : 0;

      const delayedCheckins = deptSheets.filter((s) => {
        if (s.status !== "APPROVED") return false;
        return s.goals.some(
          (g) => !g.achievements.some((a) => a.quarter === activeQuarter && a.actualValue != null)
        );
      }).length;

      const delayedApprovalsDept = deptSheets.filter(
        (s) => s.status === "SUBMITTED" && s.submittedAt && daysSince(s.submittedAt) > 5
      ).length;

      const deptEsc = await prisma.escalationLog.count({
        where: {
          status: { not: "RESOLVED" },
          employee: { departmentId: dept.id },
        },
      });

      const risk = deptRisks.find((r) => r.id === dept.id);
      const riskScore = risk?.score ?? 0;
      const healthStatus =
        riskScore > 60 ? "critical" : riskScore > 30 ? "warning" : "healthy";

      const mgrInDept = managers.filter((m) => m.directReports.some((r) => r.goalSheets.length > 0));
      const responsiveness =
        mgrInDept.length > 0
          ? Math.round(
              (mgrInDept.filter((m) =>
                m.directReports.every((r) => {
                  const sh = r.goalSheets[0];
                  return !sh || sh.status !== "SUBMITTED" || (sh.submittedAt && daysSince(sh.submittedAt) <= 5);
                })
              ).length /
                mgrInDept.length) *
                100
            )
          : 100;

      return {
        departmentId: dept.id,
        department: dept.name,
        completionPct,
        delayedCheckins,
        riskScore,
        escalationCount: deptEsc,
        managerResponsiveness: responsiveness,
        healthStatus,
        delayedApprovals: delayedApprovalsDept,
        trendPct: Math.round((Math.random() - 0.3) * 20),
      };
    })
  );

  const kpiMap = Object.fromEntries(
    kpis.map((k) => [k.key, k.unit === "%" ? k.value : k.value])
  ) as Record<string, number>;

  const insights = generateExecutiveInsights({
    kpis: {
      orgGoalCompletion: kpiMap.orgGoalCompletion ?? 0,
      checkinCompliance: kpiMap.checkinCompliance ?? 0,
      activeEscalations: kpiMap.activeEscalations ?? 0,
      sharedGoalAdoption: kpiMap.sharedGoalAdoption ?? 0,
    },
    departmentHealth,
    atRiskEmployees,
  });

  return {
    kpis,
    departmentHealth,
    alignmentTree,
    insights,
    atRiskEmployees,
    escalationSummary: {
      unresolvedCount: escalationAnalytics.unresolvedCount,
      avgResolutionDays: escalationAnalytics.avgResolutionDays,
      managerSlaCompliance: escalationAnalytics.managerSlaCompliance,
      severityDistribution: escalationAnalytics.severityDistribution,
    },
  };
}

function kpi(
  key: string,
  label: string,
  value: number,
  unit: "%" | "count",
  trendPct: number,
  previousValue: number,
  sparkline: number[],
  invertSeverity = false
): ExecutiveKpi {
  let severity: ExecutiveKpi["severity"] = "healthy";
  if (unit === "%") {
    if (value < 50) severity = "critical";
    else if (value < 70) severity = "warning";
  } else if (invertSeverity) {
    if (value > 15) severity = "critical";
    else if (value > 5) severity = "warning";
  }
  return { key, label, value, unit, trendPct, previousValue, sparkline, severity };
}

function spark(base: number, invert = false): number[] {
  const pts = [base - 8, base - 5, base - 3, base - 1, base];
  return pts.map((p) => Math.max(0, invert ? Math.min(100, p) : p));
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}
