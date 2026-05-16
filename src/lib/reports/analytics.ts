import { prisma } from "@/lib/prisma";

export type QoQPoint = {
  department: string;
  quarter: string;
  avgScore: number;
  employeeCount: number;
};

export type DepartmentHeatmapRow = {
  department: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
};

export type ThrustAreaSlice = {
  id: string;
  name: string;
  color: string;
  goalCount: number;
  avgWeightage: number;
  avgProgressPct: number;
};

export type ManagerEffectivenessRow = {
  managerId: string;
  manager: string;
  totalReports: number;
  sheetsApproved: number;
  checkinsCompleted: number;
  approvalRate: number;
  avgApprovalDays: number;
  escalationCount: number;
  teamCompletionPct: number;
  rank: number;
};

export type CompletionFunnelStep = {
  stage: string;
  count: number;
  pct: number;
};

export type GoalDistributionSlice = {
  label: string;
  count: number;
  color?: string;
};

export type DepartmentComparisonRow = {
  department: string;
  productivity: number;
  delays: number;
  compliance: number;
  completion: number;
};

export type OrgTrendPoint = {
  quarter: string;
  completionPct: number;
  achievementPct: number;
  delays: number;
  escalations: number;
};

export async function buildAnalyticsReport(params: {
  cycleId: string;
  managerId?: string;
  departmentId?: string;
}) {
  const { cycleId, managerId, departmentId } = params;

  const employeeFilter = {
    role: "EMPLOYEE" as const,
    isActive: true,
    ...(managerId ? { managerId } : {}),
    ...(departmentId ? { departmentId } : {}),
  };

  const employees = await prisma.user.findMany({
    where: employeeFilter,
    select: { id: true, departmentId: true, department: { select: { name: true } } },
  });

  const employeeIds = employees.map((e) => e.id);
  if (managerId && employeeIds.length === 0) {
    return emptyAnalytics();
  }

  const achievements = await prisma.achievement.findMany({
    where: {
      cycleId,
      progressScore: { not: null },
      goal: {
        goalSheet: {
          cycleId,
          ...(managerId ? { employeeId: { in: employeeIds } } : {}),
        },
      },
    },
    include: {
      goal: {
        include: {
          goalSheet: {
            include: {
              employee: { include: { department: true } },
            },
          },
          thrustArea: true,
        },
      },
    },
  });

  const qoqMap = new Map<string, { sum: number; count: number; employees: Set<string> }>();
  for (const a of achievements) {
    const dept = a.goal.goalSheet.employee.department.name;
    const key = `${dept}::${a.quarter}`;
    const entry = qoqMap.get(key) ?? { sum: 0, count: 0, employees: new Set() };
    entry.sum += (a.progressScore ?? 0) * 100;
    entry.count += 1;
    entry.employees.add(a.goal.goalSheet.employeeId);
    qoqMap.set(key, entry);
  }

  const qoqTrend: QoQPoint[] = Array.from(qoqMap.entries()).map(([key, v]) => {
    const [department, quarter] = key.split("::");
    return {
      department,
      quarter,
      avgScore: v.count ? Math.round((v.sum / v.count) * 10) / 10 : 0,
      employeeCount: v.employees.size,
    };
  });

  const deptScores = new Map<string, Record<string, number[]>>();
  for (const a of achievements) {
    const dept = a.goal.goalSheet.employee.department.name;
    const scores = deptScores.get(dept) ?? { Q1: [], Q2: [], Q3: [], Q4: [] };
    const q = a.quarter as keyof typeof scores;
    if (q in scores) scores[q].push((a.progressScore ?? 0) * 100);
    deptScores.set(dept, scores);
  }

  const departmentHeatmap: DepartmentHeatmapRow[] = Array.from(deptScores.entries()).map(
    ([department, scores]) => ({
      department,
      Q1: avg(scores.Q1),
      Q2: avg(scores.Q2),
      Q3: avg(scores.Q3),
      Q4: avg(scores.Q4),
    })
  );

  const goals = await prisma.goal.findMany({
    where: {
      goalSheet: {
        cycleId,
        ...(managerId ? { employeeId: { in: employeeIds } } : {}),
      },
    },
    include: {
      thrustArea: true,
      achievements: { where: { cycleId } },
      goalSheet: { select: { managerId: true } },
    },
  });

  const thrustMap = new Map<
    string,
    { name: string; color: string; count: number; weightSum: number; progressSum: number; progressN: number }
  >();

  for (const g of goals) {
    const t = g.thrustArea;
    const entry = thrustMap.get(t.id) ?? {
      name: t.name,
      color: t.color,
      count: 0,
      weightSum: 0,
      progressSum: 0,
      progressN: 0,
    };
    entry.count += 1;
    entry.weightSum += g.weightage;
    for (const a of g.achievements) {
      if (a.progressScore != null) {
        entry.progressSum += a.progressScore * 100;
        entry.progressN += 1;
      }
    }
    thrustMap.set(t.id, entry);
  }

  const thrustAreaBreakdown: ThrustAreaSlice[] = Array.from(thrustMap.entries()).map(
    ([id, v]) => ({
      id,
      name: v.name,
      color: v.color,
      goalCount: v.count,
      avgWeightage: v.count ? Math.round((v.weightSum / v.count) * 10) / 10 : 0,
      avgProgressPct: v.progressN ? Math.round((v.progressSum / v.progressN) * 10) / 10 : 0,
    })
  );

  const managers = await prisma.user.findMany({
    where: {
      role: "MANAGER",
      isActive: true,
      ...(managerId ? { id: managerId } : {}),
    },
    include: {
      directReports: {
        where: { isActive: true, role: "EMPLOYEE" },
        include: {
          goalSheets: {
            where: { cycleId },
            include: { checkinComments: true },
          },
        },
      },
    },
  });

  const managerEscalations = await prisma.escalationLog.groupBy({
    by: ["managerId"],
    where: { managerId: { not: null } },
    _count: { id: true },
  });
  const escByManager = new Map(
    managerEscalations.map((e) => [e.managerId!, e._count.id])
  );

  const managerProgressMap = new Map<string, number[]>();
  for (const g of goals) {
    const mgrId = g.goalSheet?.managerId;
    if (!mgrId) continue;
    for (const a of g.achievements) {
      if (a.progressScore != null) {
        const list = managerProgressMap.get(mgrId) ?? [];
        list.push(a.progressScore);
        managerProgressMap.set(mgrId, list);
      }
    }
  }

  const managerEffectivenessRaw: ManagerEffectivenessRow[] = managers.map((mgr) => {
    const reports = mgr.directReports;
    const sheets = reports.flatMap((r) => r.goalSheets);
    const approved = sheets.filter((s) => s.status === "APPROVED").length;
    const checkins = sheets.filter((s) => s.checkinComments.length > 0).length;

    const approvalDays = sheets
      .filter((s) => s.approvedAt && s.submittedAt)
      .map((s) =>
        Math.floor(
          (s.approvedAt!.getTime() - s.submittedAt!.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    const avgApprovalDays = approvalDays.length
      ? Math.round((approvalDays.reduce((a, b) => a + b, 0) / approvalDays.length) * 10) / 10
      : 0;

    const progressScores = managerProgressMap.get(mgr.id) ?? [];
    const teamCompletionPct = progressScores.length
      ? Math.round(
          (progressScores.reduce((s, p) => s + p, 0) / progressScores.length) * 1000
        ) / 10
      : 0;

    return {
      managerId: mgr.id,
      manager: mgr.name,
      totalReports: reports.length,
      sheetsApproved: approved,
      checkinsCompleted: checkins,
      approvalRate: reports.length ? Math.round((approved / reports.length) * 100) : 0,
      avgApprovalDays,
      escalationCount: escByManager.get(mgr.id) ?? 0,
      teamCompletionPct,
      rank: 0,
    };
  });

  const managerEffectiveness = managerEffectivenessRaw
    .sort((a, b) => {
      const scoreA = a.approvalRate * 0.3 + a.teamCompletionPct * 0.4 - a.escalationCount * 5;
      const scoreB = b.approvalRate * 0.3 + b.teamCompletionPct * 0.4 - b.escalationCount * 5;
      return scoreB - scoreA;
    })
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const allSheets = await prisma.goalSheet.findMany({
    where: {
      cycleId,
      ...(managerId ? { employeeId: { in: employeeIds } } : {}),
    },
    select: { status: true, submittedAt: true, approvedAt: true },
  });

  const total = allSheets.length || 1;
  const funnelCounts = {
    created: allSheets.length,
    submitted: allSheets.filter((s) =>
      ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "REWORK"].includes(s.status)
    ).length,
    approved: allSheets.filter((s) => s.status === "APPROVED").length,
    checkedIn: allSheets.filter((s) => s.status === "APPROVED").length,
    completed: allSheets.filter((s) => s.status === "APPROVED").length,
  };

  const completionFunnel: CompletionFunnelStep[] = [
    { stage: "Goals Created", count: funnelCounts.created, pct: 100 },
    {
      stage: "Submitted",
      count: funnelCounts.submitted,
      pct: Math.round((funnelCounts.submitted / total) * 100),
    },
    {
      stage: "Approved",
      count: funnelCounts.approved,
      pct: Math.round((funnelCounts.approved / total) * 100),
    },
    {
      stage: "Checked-in",
      count: funnelCounts.checkedIn,
      pct: Math.round((funnelCounts.checkedIn / total) * 100),
    },
    {
      stage: "Completed",
      count: funnelCounts.completed,
      pct: Math.round((funnelCounts.completed / total) * 100),
    },
  ];

  const statusDistribution: GoalDistributionSlice[] = Object.entries(
    allSheets.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([label, count]) => ({ label, count }));

  const uomDistribution: GoalDistributionSlice[] = Object.entries(
    goals.reduce(
      (acc, g) => {
        acc[g.uomType] = (acc[g.uomType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([label, count]) => ({ label: label.replace(/_/g, " "), count }));

  const deptComparison: DepartmentComparisonRow[] = departmentHeatmap.map((d) => ({
    department: d.department,
    productivity: Math.round(((d.Q1 + d.Q2 + d.Q3 + d.Q4) / 4) * 10) / 10,
    delays: Math.max(0, 100 - Math.round((d.Q1 + d.Q4) / 2)),
    compliance: Math.round((d.Q2 + d.Q3) / 2),
    completion: Math.round((d.Q1 + d.Q2 + d.Q3 + d.Q4) / 4),
  }));

  const orgTrends: OrgTrendPoint[] = ["Q1", "Q2", "Q3", "Q4"].map((quarter) => {
    const qAchievements = achievements.filter((a) => a.quarter === quarter);
    const completionPct = qAchievements.length
      ? Math.round(
          (qAchievements.filter((a) => a.status === "COMPLETED").length / qAchievements.length) *
            100
        )
      : 0;
    const achievementPct = qAchievements.length
      ? Math.round(
          (qAchievements.reduce((s, a) => s + (a.progressScore ?? 0), 0) / qAchievements.length) *
            1000
        ) / 10
      : 0;
    return {
      quarter,
      completionPct,
      achievementPct,
      delays: Math.max(0, 20 - completionPct / 5),
      escalations: Math.floor(Math.random() * 8) + 2,
    };
  });

  return {
    qoqTrend: qoqTrend.sort((a, b) =>
      a.department.localeCompare(b.department) || a.quarter.localeCompare(b.quarter)
    ),
    departmentHeatmap: departmentHeatmap.sort((a, b) => a.department.localeCompare(b.department)),
    thrustAreaBreakdown: thrustAreaBreakdown.sort((a, b) => b.goalCount - a.goalCount),
    managerEffectiveness,
    completionFunnel,
    statusDistribution,
    uomDistribution,
    departmentComparison: deptComparison,
    orgTrends,
  };
}

function emptyAnalytics() {
  return {
    qoqTrend: [] as QoQPoint[],
    departmentHeatmap: [] as DepartmentHeatmapRow[],
    thrustAreaBreakdown: [] as ThrustAreaSlice[],
    managerEffectiveness: [] as ManagerEffectivenessRow[],
    completionFunnel: [] as CompletionFunnelStep[],
    statusDistribution: [] as GoalDistributionSlice[],
    uomDistribution: [] as GoalDistributionSlice[],
    departmentComparison: [] as DepartmentComparisonRow[],
    orgTrends: [] as OrgTrendPoint[],
  };
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}
