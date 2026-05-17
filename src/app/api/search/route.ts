import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess({ results: [] });
  }

  const role = session.user.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER" || isAdmin;

  const [
    users,
    departments,
    thrustAreas,
    goalSheets,
    goals,
    escalationLogs,
    spaces,
    operationalEvents,
  ] = await Promise.all([
    isAdmin || isManager
      ? prisma.user.findMany({
          where: { isActive: true },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            role: true,
            department: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.department.findMany({
          where: { isActive: true },
          take: 15,
          select: { id: true, name: true, code: true },
        })
      : Promise.resolve([]),
    prisma.thrustArea.findMany({
      where: { isActive: true },
      take: 15,
      select: { id: true, name: true },
    }),
    prisma.goalSheet.findMany({
      where: isAdmin
        ? {}
        : isManager
          ? { managerId: session.user.id }
          : { employeeId: session.user.id },
      take: 25,
      select: {
        id: true,
        status: true,
        employee: { select: { name: true, employeeCode: true } },
        cycle: { select: { name: true } },
      },
    }),
    prisma.goal.findMany({
      where: isAdmin
        ? {}
        : isManager
          ? { goalSheet: { managerId: session.user.id } }
          : { goalSheet: { employeeId: session.user.id } },
      take: 30,
      select: {
        id: true,
        title: true,
        goalSheet: {
          select: {
            id: true,
            employee: { select: { name: true } },
          },
        },
      },
    }),
    isAdmin
      ? prisma.escalationLog.findMany({
          take: 15,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            rule: { select: { trigger: true } },
            employee: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.collaborationSpace.findMany({
          take: 12,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, description: true },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.operationalEvent.findMany({
          take: 12,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
          },
        })
      : Promise.resolve([]),
  ]);

  type SearchResult = {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    href: string;
  };

  const results: SearchResult[] = [];

  for (const u of users) {
    if (matches(q, u.name, u.email, u.employeeCode)) {
      const base = isAdmin ? "/admin/users" : "/manager/team";
      results.push({
        id: `user-${u.id}`,
        type: "Employee",
        title: u.name,
        subtitle: `${u.employeeCode ?? ""} · ${u.department?.name ?? ""}`,
        href: isAdmin ? `${base}?highlight=${u.id}` : base,
      });
    }
  }

  for (const d of departments) {
    if (matches(q, d.name, d.code)) {
      results.push({
        id: `dept-${d.id}`,
        type: "Department",
        title: d.name,
        subtitle: d.code,
        href: "/admin/departments",
      });
    }
  }

  for (const t of thrustAreas) {
    if (matches(q, t.name)) {
      results.push({
        id: `thrust-${t.id}`,
        type: "Initiative",
        title: t.name,
        href: isAdmin ? "/admin/thrust-areas" : "/employee/goals",
      });
    }
  }

  for (const g of goals) {
    if (matches(q, g.title, g.goalSheet.employee.name)) {
      const href =
        role === "EMPLOYEE"
          ? `/employee/goals/${g.goalSheet.id}`
          : isManager
            ? `/manager/approvals/${g.goalSheet.id}`
            : "/admin/reports/achievement";
      results.push({
        id: `goal-${g.id}`,
        type: "Goal",
        title: g.title,
        subtitle: g.goalSheet.employee.name,
        href,
      });
    }
  }

  for (const s of goalSheets) {
    if (matches(q, s.employee.name, s.employee.employeeCode, s.cycle.name)) {
      const href =
        role === "EMPLOYEE"
          ? `/employee/goals/${s.id}`
          : isManager
            ? `/manager/approvals/${s.id}`
            : "/admin/reports/achievement";
      results.push({
        id: `sheet-${s.id}`,
        type: "Goal Sheet",
        title: `${s.employee.name} — ${s.cycle.name}`,
        subtitle: s.status,
        href,
      });
    }
  }

  for (const e of escalationLogs) {
    const ruleLabel = e.rule.trigger.replace(/_/g, " ");
    if (matches(q, ruleLabel, e.employee?.name, e.status)) {
      results.push({
        id: `esc-${e.id}`,
        type: "Escalation",
        title: ruleLabel,
        subtitle: e.employee?.name ?? e.status,
        href: "/admin/escalations",
      });
    }
  }

  for (const space of spaces) {
    if (matches(q, space.name, space.description)) {
      results.push({
        id: `space-${space.id}`,
        type: "Collaboration",
        title: space.name,
        subtitle: space.description ?? undefined,
        href: `/admin/collaboration/${space.id}`,
      });
    }
  }

  for (const ev of operationalEvents) {
    const label = ev.title ?? ev.type.replace(/_/g, " ");
    if (matches(q, label, ev.description, ev.type)) {
      results.push({
        id: `evt-${ev.id}`,
        type: "Activity",
        title: label,
        subtitle: ev.description ?? undefined,
        href: "/admin/activity",
      });
    }
  }

  if (isAdmin && matches(q, "risk", "forecast", "predict", "briefing", "insight", "ai")) {
    const aiRoutes: SearchResult[] = [
      { id: "ai-briefing", type: "AI Insight", title: "Executive Briefing", href: "/admin/briefing" },
      { id: "ai-forecast", type: "AI Insight", title: "Predictive Forecast", href: "/admin/forecast" },
      { id: "ai-align", type: "AI Insight", title: "Alignment Graph", href: "/admin/alignment" },
      { id: "ai-exec", type: "AI Insight", title: "Executive Intelligence", href: "/admin/executive" },
    ];
    for (const r of aiRoutes) {
      if (matches(q, r.title, "ai insight intelligence")) {
        results.push(r);
      }
    }
  }

  return apiSuccess({ results: results.slice(0, 16) });
}
