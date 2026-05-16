import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { computeEscalationSeverity } from "@/lib/risk/escalation-utils";

export type ActivityItem = {
  id: string;
  kind: "audit" | "approval" | "escalation" | "submission";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  actorName: string;
  entityType: string;
  entityId: string;
  href: string | null;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 30)));
  const severity = req.nextUrl.searchParams.get("severity") ?? undefined;
  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;

  let auditWhere: Prisma.AuditLogWhereInput = {};
  if (session.user.role === "EMPLOYEE") {
    auditWhere = {
      OR: [
        { affectedUserId: session.user.id },
        { goalSheet: { employeeId: session.user.id } },
      ],
    };
  } else if (session.user.role === "MANAGER") {
    auditWhere = { goalSheet: { managerId: session.user.id } };
  }

  const [audits, escalations, submissions] = await Promise.all([
    prisma.auditLog.findMany({
      where: auditWhere,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        goalSheet: {
          select: {
            id: true,
            employee: { select: { name: true } },
          },
        },
      },
    }),
    session.user.role === "ADMIN"
      ? prisma.escalationLog.findMany({
          take: Math.floor(limit / 3),
          orderBy: { createdAt: "desc" },
          include: {
            employee: { select: { name: true } },
            rule: { select: { trigger: true } },
          },
        })
      : Promise.resolve([]),
    session.user.role !== "EMPLOYEE"
      ? prisma.goalSheet.findMany({
          where: {
            status: "SUBMITTED",
            submittedAt: { not: null },
            ...(session.user.role === "MANAGER"
              ? { managerId: session.user.id }
              : {}),
          },
          take: Math.floor(limit / 3),
          orderBy: { submittedAt: "desc" },
          include: {
            employee: { select: { name: true } },
            cycle: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const items: ActivityItem[] = [];

  for (const log of audits) {
    const sev =
      log.action === "REJECTED"
        ? "high"
        : log.action === "APPROVED"
          ? "low"
          : log.action === "SUBMITTED"
            ? "medium"
            : "low";
    items.push({
      id: `audit-${log.id}`,
      kind: "audit",
      title: log.action.replace(/_/g, " "),
      description: `${log.entityType}${log.goalSheet?.employee ? ` · ${log.goalSheet.employee.name}` : ""}`,
      severity: sev as ActivityItem["severity"],
      actorName: log.createdBy.name,
      entityType: log.entityType,
      entityId: log.entityId,
      href:
        session.user.role === "ADMIN"
          ? "/admin/audit-log"
          : log.goalSheet
            ? `/manager/approvals/${log.goalSheet.id}`
            : null,
      createdAt: log.createdAt.toISOString(),
    });
  }

  for (const e of escalations) {
    const sev = computeEscalationSeverity(e) as ActivityItem["severity"];
    items.push({
      id: `esc-${e.id}`,
      kind: "escalation",
      title: "Escalation triggered",
      description: `${e.employee.name} · ${e.rule.trigger}`,
      severity: sev === "critical" ? "critical" : sev === "high" ? "high" : "medium",
      actorName: "System",
      entityType: "EscalationLog",
      entityId: e.id,
      href: "/admin/escalations",
      createdAt: e.createdAt.toISOString(),
    });
  }

  for (const s of submissions) {
    items.push({
      id: `sub-${s.id}`,
      kind: "submission",
      title: "Goal sheet submitted",
      description: `${s.employee.name} · ${s.cycle.name}`,
      severity: "medium",
      actorName: s.employee.name,
      entityType: "GoalSheet",
      entityId: s.id,
      href: `/manager/approvals/${s.id}`,
      createdAt: s.submittedAt!.toISOString(),
    });
  }

  let filtered = items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (severity) filtered = filtered.filter((i) => i.severity === severity);
  if (kind) filtered = filtered.filter((i) => i.kind === kind);

  return apiSuccess({ items: filtered.slice(0, limit) });
}
