import type { EscalationLog, EscalationRule } from "@prisma/client";

export type EscalationSeverity = "low" | "medium" | "critical";

type EscalationInput = {
  status: EscalationLog["status"];
  createdAt: Date | string;
  rule: { trigger: EscalationRule["trigger"] | string; daysThreshold?: number };
};

export function computeEscalationSeverity(log: EscalationInput): EscalationSeverity {
  const daysOpen = Math.floor(
    (Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const threshold = log.rule.daysThreshold ?? 7;
  const overdue = Math.max(0, daysOpen - threshold);

  if (log.status === "RESOLVED") return "low";
  if (overdue >= 7 || log.status === "ESCALATED") return "critical";
  if (overdue >= 3 || daysOpen >= threshold * 2) return "medium";
  return "low";
}

export function computeDaysOverdue(
  log: Pick<EscalationInput, "createdAt" | "rule">
): number {
  const daysOpen = Math.floor(
    (Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysOpen - (log.rule.daysThreshold ?? 7));
}

export type TimelineEvent = {
  id: string;
  label: string;
  timestamp: string;
  status: "completed" | "active" | "pending";
};

export function buildEscalationTimeline(
  log: Pick<EscalationLog, "status" | "createdAt" | "resolvedAt" | "notificationsSent"> & {
    rule: Pick<EscalationRule, "notifyHR" | "notifyManager">;
  }
): TimelineEvent[] {
  const created = new Date(log.createdAt);
  const events: TimelineEvent[] = [
    {
      id: "triggered",
      label: "Escalation triggered",
      timestamp: created.toISOString(),
      status: "completed",
    },
  ];

  const notifiedAt = new Date(created.getTime() + 60 * 60 * 1000);
  events.push({
    id: "reminder",
    label: "Reminder sent",
    timestamp: notifiedAt.toISOString(),
    status: log.status !== "PENDING" ? "completed" : "active",
  });

  if (log.rule.notifyManager) {
    events.push({
      id: "manager",
      label: "Manager escalated",
      timestamp: new Date(created.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      status:
        log.status === "ESCALATED" || log.status === "RESOLVED"
          ? "completed"
          : log.status === "NOTIFIED"
            ? "active"
            : "pending",
    });
  }

  if (log.rule.notifyHR) {
    events.push({
      id: "hr",
      label: "HR notified",
      timestamp: new Date(created.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      status:
        log.status === "ESCALATED"
          ? "completed"
          : log.status === "RESOLVED"
            ? "completed"
            : "pending",
    });
  }

  events.push({
    id: "resolved",
    label: "Resolved",
    timestamp: log.resolvedAt?.toISOString() ?? "",
    status: log.status === "RESOLVED" ? "completed" : "pending",
  });

  return events;
}
