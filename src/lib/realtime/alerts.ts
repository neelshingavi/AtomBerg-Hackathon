import { prisma } from "@/lib/prisma";
import type { NotificationPriority, Prisma } from "@prisma/client";
import { bumpRealtimeVersion } from "./events";
import { publishOperationalEvent } from "./publish";
import type { OperationalAlertItem } from "./types";

export async function createOperationalAlert(params: {
  alertType: string;
  title: string;
  message: string;
  severity?: NotificationPriority;
  recommendation?: string;
  affectedDepartments?: string[];
  cycleId?: string;
  metadata?: Record<string, unknown>;
}) {
  const alert = await prisma.operationalAlert.create({
    data: {
      alertType: params.alertType,
      title: params.title,
      message: params.message,
      severity: params.severity ?? "MEDIUM",
      recommendation: params.recommendation,
      affectedDepartments: params.affectedDepartments as Prisma.InputJsonValue | undefined,
      cycleId: params.cycleId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await publishOperationalEvent({
    type: "RISK_ALERT",
    title: params.title,
    description: params.message,
    severity:
      params.severity === "CRITICAL"
        ? "critical"
        : params.severity === "HIGH"
          ? "high"
          : "medium",
    metadata: { alertId: alert.id },
  });

  await bumpRealtimeVersion("alert");
  return alert;
}

export async function listActiveAlerts(limit = 20): Promise<OperationalAlertItem[]> {
  const rows = await prisma.operationalAlert.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map(mapAlert);
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  return prisma.operationalAlert.update({
    where: { id: alertId },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedById: userId,
      acknowledgedAt: new Date(),
    },
  });
}

function mapAlert(row: {
  id: string;
  alertType: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  recommendation: string | null;
  affectedDepartments: unknown;
  createdAt: Date;
  acknowledgedAt: Date | null;
}): OperationalAlertItem {
  return {
    id: row.id,
    alertType: row.alertType,
    title: row.title,
    message: row.message,
    severity: row.severity,
    status: row.status,
    recommendation: row.recommendation ?? undefined,
    affectedDepartments: Array.isArray(row.affectedDepartments)
      ? (row.affectedDepartments as string[])
      : undefined,
    createdAt: row.createdAt.toISOString(),
    acknowledgedAt: row.acknowledgedAt?.toISOString(),
  };
}

/** Heuristic alert synthesis from operational metrics (for live demos). */
export async function synthesizeLiveAlerts(cycleId: string) {
  const [pending, escalations, recentEscalations] = await Promise.all([
    prisma.goalSheet.count({ where: { status: "SUBMITTED", cycleId } }),
    prisma.escalationLog.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.escalationLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const existing = await prisma.operationalAlert.count({
    where: { status: "ACTIVE", createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (existing >= 3) return;

  if (pending >= 8) {
    await createOperationalAlert({
      alertType: "approval_bottleneck",
      title: "Approval bottleneck detected",
      message: `${pending} goal sheets awaiting approval may impact quarterly execution timelines.`,
      severity: "HIGH",
      recommendation: "Review manager approval queues and reassign overloaded approvers.",
      cycleId,
    });
  }

  if (recentEscalations >= 5 && escalations >= 3) {
    await createOperationalAlert({
      alertType: "escalation_spike",
      title: "Escalation volume increasing",
      message: `Escalation activity rose this week (${recentEscalations} new). Active unresolved: ${escalations}.`,
      severity: "CRITICAL",
      recommendation: "Launch incident review and inspect Operations / Finance queues.",
      cycleId,
    });
  }
}
