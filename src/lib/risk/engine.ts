import { prisma } from "@/lib/prisma";
import { getActiveQuarter } from "@/lib/cycle";
import type { RiskEntity, RiskFactor } from "./types";
import { scoreToLevel } from "./types";

const FACTOR_WEIGHTS: Record<RiskFactor, number> = {
  overdue_approval: 20,
  low_goal_progress: 18,
  missed_checkin: 22,
  inactive_employee: 15,
  delayed_manager: 12,
  repeated_escalation: 18,
  low_completion_trend: 15,
};

export async function computeEmployeeRisks(params: {
  cycleId: string;
  departmentId?: string;
  managerId?: string;
  limit?: number;
}): Promise<RiskEntity[]> {
  const { cycleId, departmentId, managerId, limit = 50 } = params;
  const activeQuarter = await prisma.goalCycle
    .findUnique({ where: { id: cycleId } })
    .then((c) => (c ? getActiveQuarter(c) : "Q1"));

  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
      ...(managerId ? { managerId } : {}),
    },
    include: {
      department: { select: { name: true } },
      manager: { select: { name: true } },
      goalSheets: {
        where: { cycleId },
        include: {
          goals: {
            include: {
              achievements: { where: { cycleId } },
            },
          },
        },
      },
      escalationsEmployee: {
        where: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
      },
    },
  });

  const entities: RiskEntity[] = [];

  for (const emp of employees) {
    const factors: RiskEntity["factors"] = [];
    let score = 0;

    const sheet = emp.goalSheets[0];
    if (!sheet) {
      factors.push({
        factor: "missed_checkin",
        label: "No goal sheet for active cycle",
        weight: FACTOR_WEIGHTS.missed_checkin,
      });
      score += FACTOR_WEIGHTS.missed_checkin;
    } else {
      if (sheet.status === "SUBMITTED" && sheet.submittedAt) {
        const days = daysSince(sheet.submittedAt);
        if (days > 5) {
          factors.push({
            factor: "overdue_approval",
            label: `Approval pending ${days} days`,
            weight: FACTOR_WEIGHTS.overdue_approval,
          });
          score += FACTOR_WEIGHTS.overdue_approval;
        }
      }

      const goals = sheet.goals;
      const atRiskCount = goals.flatMap((g) => g.achievements).filter((a) => a.status === "AT_RISK").length;
      const avgProgress =
        goals.length > 0
          ? goals.reduce((sum, g) => {
              const latest = g.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
              return sum + (latest?.progressScore ?? 0);
            }, 0) / goals.length
          : 0;

      if (avgProgress < 0.3 && sheet.status === "APPROVED") {
        factors.push({
          factor: "low_goal_progress",
          label: `Low average progress (${Math.round(avgProgress * 100)}%)`,
          weight: FACTOR_WEIGHTS.low_goal_progress,
        });
        score += FACTOR_WEIGHTS.low_goal_progress;
      }

      if (atRiskCount > 0) {
        factors.push({
          factor: "low_completion_trend",
          label: `${atRiskCount} goal(s) marked at risk`,
          weight: FACTOR_WEIGHTS.low_completion_trend,
        });
        score += FACTOR_WEIGHTS.low_completion_trend * Math.min(atRiskCount, 2);
      }

      if (sheet.status === "APPROVED" && activeQuarter) {
        const missingCheckin = goals.some((g) =>
          !g.achievements.some((a) => a.quarter === activeQuarter && a.actualValue != null)
        );
        if (missingCheckin) {
          factors.push({
            factor: "missed_checkin",
            label: `${activeQuarter} check-in incomplete`,
            weight: FACTOR_WEIGHTS.missed_checkin,
          });
          score += FACTOR_WEIGHTS.missed_checkin;
        }
      }

      if (sheet.status === "DRAFT") {
        factors.push({
          factor: "inactive_employee",
          label: "Goal sheet still in draft",
          weight: FACTOR_WEIGHTS.inactive_employee,
        });
        score += FACTOR_WEIGHTS.inactive_employee;
      }
    }

    const escCount = emp.escalationsEmployee.filter((e) => e.status !== "RESOLVED").length;
    if (escCount >= 1) {
      factors.push({
        factor: "repeated_escalation",
        label: `${escCount} active escalation(s)`,
        weight: FACTOR_WEIGHTS.repeated_escalation,
      });
      score += FACTOR_WEIGHTS.repeated_escalation;
    }
    if (emp.escalationsEmployee.length >= 2) {
      score += 8;
    }

    if (factors.length === 0) continue;

    const capped = Math.min(100, score);
    entities.push({
      id: emp.id,
      name: emp.name,
      type: "employee",
      score: capped,
      level: scoreToLevel(capped),
      factors,
      department: emp.department.name,
      managerName: emp.manager?.name,
      affectedGoals: sheet?.goals.length ?? 0,
      escalationCount: emp.escalationsEmployee.length,
      daysOverdue: sheet?.submittedAt ? daysSince(sheet.submittedAt) : undefined,
    });
  }

  return entities.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function computeDepartmentRisks(cycleId: string): Promise<RiskEntity[]> {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { role: "EMPLOYEE", isActive: true },
        select: { id: true },
      },
    },
  });

  const employeeRisks = await computeEmployeeRisks({ cycleId, limit: 500 });
  const byDept = new Map<string, RiskEntity[]>();

  for (const r of employeeRisks) {
    const dept = r.department ?? "Unknown";
    const list = byDept.get(dept) ?? [];
    list.push(r);
    byDept.set(dept, list);
  }

  return departments.map((d) => {
    const risks = byDept.get(d.name) ?? [];
    const avgScore = risks.length
      ? Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length)
      : 0;
    const criticalCount = risks.filter((r) => r.level === "critical").length;

    return {
      id: d.id,
      name: d.name,
      type: "department" as const,
      score: Math.min(100, avgScore + criticalCount * 5),
      level: scoreToLevel(Math.min(100, avgScore + criticalCount * 5)),
      factors: [
        {
          factor: "low_completion_trend" as RiskFactor,
          label: `${risks.length} at-risk employees`,
          weight: avgScore,
        },
      ],
      escalationCount: risks.reduce((s, r) => s + (r.escalationCount ?? 0), 0),
    };
  });
}

export async function computeManagerRisks(cycleId: string): Promise<RiskEntity[]> {
  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true },
    include: {
      directReports: {
        where: { role: "EMPLOYEE", isActive: true },
        include: {
          goalSheets: {
            where: { cycleId },
          },
        },
      },
      escalationsManager: {
        where: { status: { not: "RESOLVED" } },
      },
    },
  });

  const results: RiskEntity[] = [];

  for (const mgr of managers) {
    const factors: RiskEntity["factors"] = [];
    let score = 0;

    const pending = mgr.directReports
      .flatMap((r) => r.goalSheets)
      .filter((s) => s.status === "SUBMITTED");

    if (pending.length > 0) {
      const maxDays = Math.max(
        ...pending.map((s) => (s.submittedAt ? daysSince(s.submittedAt) : 0))
      );
      if (maxDays > 3) {
        factors.push({
          factor: "delayed_manager",
          label: `${pending.length} approvals delayed (max ${maxDays}d)`,
          weight: FACTOR_WEIGHTS.delayed_manager,
        });
        score += FACTOR_WEIGHTS.delayed_manager + Math.min(maxDays, 10);
      }
    }

    if (mgr.escalationsManager.length > 0) {
      factors.push({
        factor: "repeated_escalation",
        label: `${mgr.escalationsManager.length} unresolved escalations`,
        weight: FACTOR_WEIGHTS.repeated_escalation,
      });
      score += FACTOR_WEIGHTS.repeated_escalation;
    }

    if (!factors.length) continue;

    const capped = Math.min(100, score);
    const firstPending = pending[0];
    results.push({
      id: mgr.id,
      name: mgr.name,
      type: "manager",
      score: capped,
      level: scoreToLevel(capped),
      factors,
      daysOverdue:
        firstPending?.submittedAt != null ? daysSince(firstPending.submittedAt) : undefined,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}
