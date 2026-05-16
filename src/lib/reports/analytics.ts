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
};

export async function buildAnalyticsReport(params: {
  cycleId: string;
  managerId?: string;
}) {
  const { cycleId, managerId } = params;

  const employeeFilter = managerId
    ? { managerId, role: "EMPLOYEE" as const, isActive: true }
    : { role: "EMPLOYEE" as const, isActive: true };

  const employees = await prisma.user.findMany({
    where: employeeFilter,
    select: { id: true, departmentId: true, department: { select: { name: true } } },
  });

  const employeeIds = employees.map((e) => e.id);
  if (managerId && employeeIds.length === 0) {
    return {
      qoqTrend: [] as QoQPoint[],
      departmentHeatmap: [] as DepartmentHeatmapRow[],
      thrustAreaBreakdown: [] as ThrustAreaSlice[],
      managerEffectiveness: [] as ManagerEffectivenessRow[],
    };
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

  const managerEffectiveness: ManagerEffectivenessRow[] = managers.map((mgr) => {
    const reports = mgr.directReports;
    const sheets = reports.flatMap((r) => r.goalSheets);
    const approved = sheets.filter((s) => s.status === "APPROVED").length;
    const checkins = sheets.filter((s) => s.checkinComments.length > 0).length;
    return {
      managerId: mgr.id,
      manager: mgr.name,
      totalReports: reports.length,
      sheetsApproved: approved,
      checkinsCompleted: checkins,
      approvalRate: reports.length ? Math.round((approved / reports.length) * 100) : 0,
    };
  });

  return {
    qoqTrend: qoqTrend.sort((a, b) =>
      a.department.localeCompare(b.department) || a.quarter.localeCompare(b.quarter)
    ),
    departmentHeatmap: departmentHeatmap.sort((a, b) => a.department.localeCompare(b.department)),
    thrustAreaBreakdown: thrustAreaBreakdown.sort((a, b) => b.goalCount - a.goalCount),
    managerEffectiveness,
  };
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}
