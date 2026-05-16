import { prisma } from "@/lib/prisma";

export type AlignmentNode = {
  id: string;
  type: "company" | "department" | "team" | "employee";
  title: string;
  subtitle?: string;
  progressPct: number;
  children: AlignmentNode[];
  isShared?: boolean;
};

export async function buildAlignmentTree(cycleId: string): Promise<AlignmentNode> {
  const [sharedGoals, departments, sheets] = await Promise.all([
    prisma.sharedGoal.findMany({
      where: { cycleId, isActive: true },
      include: { thrustArea: true },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { role: { in: ["MANAGER", "EMPLOYEE"] }, isActive: true },
          select: {
            id: true,
            name: true,
            role: true,
            managerId: true,
            goalSheets: {
              where: { cycleId },
              include: {
                goals: {
                  include: {
                    achievements: { where: { cycleId } },
                    thrustArea: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.goalSheet.findMany({
      where: { cycleId, status: "APPROVED" },
      select: { employeeId: true },
    }),
  ]);

  const approvedIds = new Set(sheets.map((s) => s.employeeId));

  const companyChildren: AlignmentNode[] = sharedGoals.map((sg) => {
    const linkedGoals = departments.flatMap((d) =>
      d.users.flatMap((u) =>
        (u.goalSheets[0]?.goals ?? [])
          .filter((g) => g.sharedGoalId === sg.id)
          .map((g) => ({ user: u, goal: g }))
      )
    );

    const avgProgress =
      linkedGoals.length > 0
        ? Math.round(
            (linkedGoals.reduce((s, { goal }) => {
              const latest = goal.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
              return s + (latest?.progressScore ?? 0) * 100;
            }, 0) /
              linkedGoals.length) *
              10
          ) / 10
        : 0;

    return {
      id: sg.id,
      type: "company" as const,
      title: sg.title,
      subtitle: sg.thrustArea.name,
      progressPct: avgProgress,
      isShared: true,
      children: buildDepartmentBranches(departments, sg.thrustAreaId, approvedIds),
    };
  });

  if (companyChildren.length === 0) {
    return {
      id: "org-root",
      type: "company",
      title: "Organizational Goals FY",
      subtitle: "Strategic alignment",
      progressPct: 0,
      children: departments.map((d) => departmentNode(d, approvedIds)),
    };
  }

  const orgProgress =
    companyChildren.length > 0
      ? Math.round(
          companyChildren.reduce((s, c) => s + c.progressPct, 0) / companyChildren.length
        )
      : 0;

  return {
    id: "org-root",
    type: "company",
    title: "Company Strategic Priorities",
    subtitle: `${sharedGoals.length} shared organizational goals`,
    progressPct: orgProgress,
    children: companyChildren,
  };
}

type DeptWithUsers = {
  id: string;
  name: string;
  users: Array<{
    id: string;
    name: string;
    role: string;
    managerId: string | null;
    goalSheets: Array<{
      goals: Array<{
        thrustAreaId: string;
        achievements: Array<{ progressScore: number | null; quarter: string }>;
        sharedGoalId: string | null;
      }>;
    }>;
  }>;
};

function buildDepartmentBranches(
  departments: DeptWithUsers[],
  thrustAreaId: string,
  approvedIds: Set<string>
): AlignmentNode[] {
  return departments
    .map((d) => {
      const managers = d.users.filter((u) => u.role === "MANAGER");
      const relevantGoals = d.users.flatMap((u) =>
        (u.goalSheets[0]?.goals ?? []).filter((g) => g.thrustAreaId === thrustAreaId)
      );
      if (relevantGoals.length === 0) return null;

      const progress = avgAchievementProgress(relevantGoals);
      return {
        id: `dept-${d.id}-${thrustAreaId}`,
        type: "department" as const,
        title: d.name,
        subtitle: "Department KPI",
        progressPct: progress,
        children: managers.map((m) => teamNode(m, d.users, thrustAreaId, approvedIds)),
      };
    })
    .filter((n): n is AlignmentNode => n !== null);
}

function departmentNode(
  dept: {
    id: string;
    name: string;
    users: Array<{
      id: string;
      name: string;
      role: string;
      managerId: string | null;
      goalSheets: Array<{
        goals: Array<{
          achievements: Array<{ progressScore: number | null; quarter: string }>;
        }>;
      }>;
    }>;
  },
  approvedIds: Set<string>
): AlignmentNode {
  const managers = dept.users.filter((u) => u.role === "MANAGER");
  const allGoals = dept.users.flatMap((u) => u.goalSheets[0]?.goals ?? []);
  return {
    id: dept.id,
    type: "department",
    title: dept.name,
    subtitle: "Department",
    progressPct: avgAchievementProgress(allGoals),
    children: managers.map((m) => teamNode(m, dept.users, undefined, approvedIds)),
  };
}

function teamNode(
  manager: {
    id: string;
    name: string;
    goalSheets: Array<{
      goals: Array<{
        thrustAreaId: string;
        achievements: Array<{ progressScore: number | null; quarter: string }>;
        sharedGoalId: string | null;
      }>;
    }>;
  },
  allUsers: Array<{
    id: string;
    name: string;
    role: string;
    managerId: string | null;
    goalSheets: typeof manager.goalSheets;
  }>,
  thrustAreaId?: string,
  approvedIds?: Set<string>
): AlignmentNode {
  const reports = allUsers.filter((u) => u.managerId === manager.id && u.role === "EMPLOYEE");
  const teamGoals = reports.flatMap((r) => {
    const goals = r.goalSheets[0]?.goals ?? [];
    return thrustAreaId ? goals.filter((g) => g.thrustAreaId === thrustAreaId) : goals;
  });

  return {
    id: `team-${manager.id}`,
    type: "team",
    title: `${manager.name}'s Team`,
    subtitle: `${reports.length} members`,
    progressPct: avgAchievementProgress(teamGoals),
    children: reports
      .filter((r) => !approvedIds || approvedIds.has(r.id) || r.goalSheets.length > 0)
      .slice(0, 8)
      .map((emp) => {
        const goals = emp.goalSheets[0]?.goals ?? [];
        const filtered = thrustAreaId ? goals.filter((g) => g.thrustAreaId === thrustAreaId) : goals;
        return {
          id: emp.id,
          type: "employee" as const,
          title: emp.name,
          subtitle: `${filtered.length} goals`,
          progressPct: avgAchievementProgress(filtered),
          isShared: filtered.some((g) => g.sharedGoalId),
          children: [],
        };
      }),
  };
}

function avgAchievementProgress(
  goals: Array<{
    achievements: Array<{ progressScore: number | null; quarter: string }>;
  }>
): number {
  if (!goals.length) return 0;
  const scores = goals.map((g) => {
    const latest = [...g.achievements].sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    return (latest?.progressScore ?? 0) * 100;
  });
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}
