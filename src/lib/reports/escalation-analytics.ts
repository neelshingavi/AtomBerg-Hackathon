import { prisma } from "@/lib/prisma";
import {
  buildEscalationTimeline,
  computeDaysOverdue,
  computeEscalationSeverity,
  type EscalationSeverity,
} from "@/lib/risk/escalation-utils";

export type EscalationTrendPoint = {
  month: string;
  low: number;
  medium: number;
  critical: number;
  total: number;
};

export type EscalationByDepartment = {
  department: string;
  count: number;
  unresolved: number;
  avgResolutionDays: number;
};

export type EscalationAnalytics = {
  trends: EscalationTrendPoint[];
  byDepartment: EscalationByDepartment[];
  severityDistribution: { severity: EscalationSeverity; count: number }[];
  unresolvedCount: number;
  avgResolutionDays: number;
  managerSlaCompliance: number;
  recentEscalations: Array<{
    id: string;
    employeeName: string;
    department: string;
    trigger: string;
    severity: EscalationSeverity;
    status: string;
    daysOverdue: number;
    daysOpen: number;
    createdAt: string;
    timeline: ReturnType<typeof buildEscalationTimeline>;
  }>;
};

export async function buildEscalationAnalytics(params?: {
  cycleId?: string;
  departmentId?: string;
}): Promise<EscalationAnalytics> {
  const logs = await prisma.escalationLog.findMany({
    include: {
      rule: true,
      employee: { include: { department: true } },
      manager: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const filtered = params?.departmentId
    ? logs.filter((l) => l.employee.departmentId === params.departmentId)
    : logs;

  const monthMap = new Map<string, EscalationTrendPoint>();
  const deptMap = new Map<string, { count: number; unresolved: number; resolutionDays: number[] }>();
  const severityCounts = { low: 0, medium: 0, critical: 0 };
  let resolvedTotalDays = 0;
  let resolvedCount = 0;
  let unresolvedCount = 0;
  let slaCompliant = 0;
  let slaTotal = 0;

  for (const log of filtered) {
    const severity = computeEscalationSeverity(log);
    severityCounts[severity]++;

    const month = log.createdAt.toISOString().slice(0, 7);
    const pt = monthMap.get(month) ?? {
      month,
      low: 0,
      medium: 0,
      critical: 0,
      total: 0,
    };
    pt[severity]++;
    pt.total++;
    monthMap.set(month, pt);

    const dept = log.employee.department.name;
    const de = deptMap.get(dept) ?? { count: 0, unresolved: 0, resolutionDays: [] };
    de.count++;
    if (log.status !== "RESOLVED") {
      de.unresolved++;
      unresolvedCount++;
    } else if (log.resolvedAt) {
      const days = Math.floor(
        (log.resolvedAt.getTime() - log.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      de.resolutionDays.push(days);
      resolvedTotalDays += days;
      resolvedCount++;
    }
    deptMap.set(dept, de);

    const overdue = computeDaysOverdue(log);
    if (log.managerId) {
      slaTotal++;
      if (overdue <= log.rule.daysThreshold) slaCompliant++;
    }
  }

  const trends = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  const byDepartment: EscalationByDepartment[] = Array.from(deptMap.entries())
    .map(([department, v]) => ({
      department,
      count: v.count,
      unresolved: v.unresolved,
      avgResolutionDays: v.resolutionDays.length
        ? Math.round(
            (v.resolutionDays.reduce((a, b) => a + b, 0) / v.resolutionDays.length) * 10
          ) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const recentEscalations = filtered.slice(0, 20).map((log) => {
    const daysOpen = Math.floor(
      (Date.now() - log.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      id: log.id,
      employeeName: log.employee.name,
      department: log.employee.department.name,
      trigger: log.rule.trigger,
      severity: computeEscalationSeverity(log),
      status: log.status,
      daysOverdue: computeDaysOverdue(log),
      daysOpen,
      createdAt: log.createdAt.toISOString(),
      timeline: buildEscalationTimeline(log),
    };
  });

  return {
    trends,
    byDepartment,
    severityDistribution: [
      { severity: "low" as const, count: severityCounts.low },
      { severity: "medium" as const, count: severityCounts.medium },
      { severity: "critical" as const, count: severityCounts.critical },
    ],
    unresolvedCount,
    avgResolutionDays: resolvedCount ? Math.round((resolvedTotalDays / resolvedCount) * 10) / 10 : 0,
    managerSlaCompliance: slaTotal ? Math.round((slaCompliant / slaTotal) * 100) : 100,
    recentEscalations,
  };
}
