import { prisma } from "@/lib/prisma";
import type { LiveStreamEvent } from "./types";

export async function fetchLiveActivityStream(params: {
  limit?: number;
  departmentId?: string;
  since?: Date;
}): Promise<LiveStreamEvent[]> {
  const limit = Math.min(80, params.limit ?? 40);
  const where = {
    ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    ...(params.since ? { createdAt: { gte: params.since } } : {}),
  };

  const events = await prisma.operationalEvent.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { name: true } },
    },
  });

  if (events.length >= 5) {
    return events.map((e) => ({
      id: e.id,
      eventType: e.type,
      title: e.title,
      description: e.description,
      severity: e.severity as LiveStreamEvent["severity"],
      actorName: e.actor?.name,
      href: e.href ?? undefined,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  return backfillFromLegacySources(limit);
}

async function backfillFromLegacySources(limit: number): Promise<LiveStreamEvent[]> {
  const [audits, escalations] = await Promise.all([
    prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.escalationLog.findMany({
      take: Math.floor(limit / 3),
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { name: true } }, rule: true },
    }),
  ]);

  const items: LiveStreamEvent[] = [];

  for (const log of audits) {
    items.push({
      id: `audit-${log.id}`,
      eventType:
        log.action === "APPROVED"
          ? "GOAL_APPROVED"
          : log.action === "REJECTED"
            ? "GOAL_REJECTED"
            : log.action === "SUBMITTED"
              ? "GOAL_SUBMITTED"
              : log.action === "COMMENT_ADDED"
                ? "COMMENT"
                : "AUTOMATION",
      title: log.action.replace(/_/g, " "),
      description: log.entityType,
      severity:
        log.action === "REJECTED" ? "high" : log.action === "SUBMITTED" ? "medium" : "low",
      actorName: log.createdBy.name,
      createdAt: log.createdAt.toISOString(),
    });
  }

  for (const e of escalations) {
    items.push({
      id: `esc-${e.id}`,
      eventType: "ESCALATION",
      title: "Escalation triggered",
      description: `${e.employee.name} · ${e.rule.trigger}`,
      severity: "high",
      actorName: "System",
      href: "/admin/escalations",
      createdAt: e.createdAt.toISOString(),
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
