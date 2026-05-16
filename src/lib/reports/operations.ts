import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import { computeEscalationSeverity } from "@/lib/risk/escalation-utils";

export type OperationsFeed = {
  cycle: { id: string; name: string; phase: string } | null;
  latestApprovals: Array<{
    id: string;
    employeeName: string;
    managerName: string;
    approvedAt: string;
  }>;
  recentEscalations: Array<{
    id: string;
    employeeName: string;
    trigger: string;
    severity: string;
    createdAt: string;
  }>;
  overdueManagers: Array<{
    id: string;
    name: string;
    pendingCount: number;
    oldestDays: number;
  }>;
  activeUsersToday: number;
  stats: {
    pendingApprovals: number;
    activeEscalations: number;
    checkinsDue: number;
  };
};

export async function buildOperationsFeed(): Promise<OperationsFeed> {
  const cycle = await getActiveCycle();

  const [latestApprovals, recentEscalations, pendingSheets, activeUsersToday, activeEscalations] =
    await Promise.all([
      prisma.goalSheet.findMany({
        where: { status: "APPROVED", approvedAt: { not: null } },
        orderBy: { approvedAt: "desc" },
        take: 8,
        include: {
          employee: { select: { name: true } },
          manager: { select: { name: true } },
        },
      }),
      prisma.escalationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          rule: true,
          employee: { select: { name: true } },
        },
      }),
      prisma.goalSheet.findMany({
        where: { status: "SUBMITTED", submittedAt: { not: null } },
        include: { manager: { select: { id: true, name: true } } },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.escalationLog.count({ where: { status: { not: "RESOLVED" } } }),
    ]);

  const managerPending = new Map<string, { name: string; count: number; oldest: Date }>();
  for (const sheet of pendingSheets) {
    if (!sheet.manager) continue;
    const entry = managerPending.get(sheet.manager.id) ?? {
      name: sheet.manager.name,
      count: 0,
      oldest: sheet.submittedAt!,
    };
    entry.count++;
    if (sheet.submittedAt && sheet.submittedAt < entry.oldest) entry.oldest = sheet.submittedAt;
    managerPending.set(sheet.manager.id, entry);
  }

  const overdueManagers = Array.from(managerPending.entries())
    .map(([id, v]) => ({
      id,
      name: v.name,
      pendingCount: v.count,
      oldestDays: Math.floor((Date.now() - v.oldest.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter((m) => m.oldestDays > 3)
    .sort((a, b) => b.oldestDays - a.oldestDays)
    .slice(0, 8);

  return {
    cycle: cycle
      ? { id: cycle.id, name: cycle.name, phase: cycle.currentPhase }
      : null,
    latestApprovals: latestApprovals.map((s) => ({
      id: s.id,
      employeeName: s.employee.name,
      managerName: s.manager?.name ?? "—",
      approvedAt: s.approvedAt!.toISOString(),
    })),
    recentEscalations: recentEscalations.map((e) => ({
      id: e.id,
      employeeName: e.employee.name,
      trigger: e.rule.trigger,
      severity: computeEscalationSeverity(e),
      createdAt: e.createdAt.toISOString(),
    })),
    overdueManagers,
    activeUsersToday,
    stats: {
      pendingApprovals: pendingSheets.length,
      activeEscalations,
      checkinsDue: cycle
        ? await prisma.goalSheet.count({
            where: { cycleId: cycle.id, status: "APPROVED", isLocked: true },
          })
        : 0,
    },
  };
}
