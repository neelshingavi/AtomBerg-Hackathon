import { prisma } from "@/lib/prisma";
import type { AlignmentGraphNode, NodeDetailPayload } from "./types";

export async function buildNodeDetail(
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const entityId = node.entityId ?? node.id.replace(/^(sg-|dept-|mgr-|emp-|goal-)/, "");

  switch (node.type) {
    case "department":
      return buildDepartmentDetail(entityId, node, cycleId);
    case "manager":
      return buildManagerDetail(entityId, node, cycleId);
    case "employee":
      return buildEmployeeDetail(entityId, node, cycleId);
    case "goal":
      return buildGoalDetail(entityId, node, cycleId);
    case "shared_goal":
      return buildSharedGoalDetail(entityId, node, cycleId);
    default:
      return buildGenericDetail(node);
  }
}

async function buildDepartmentDetail(
  deptId: string,
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const [dept, escalations] = await Promise.all([
    prisma.department.findUnique({
      where: { id: deptId },
      include: {
        users: {
          where: { role: "EMPLOYEE", isActive: true },
          include: {
            goalSheets: {
              where: { cycleId },
              include: { goals: { include: { achievements: { where: { cycleId } } } } },
            },
          },
        },
      },
    }),
    prisma.escalationLog.findMany({
      where: { employee: { departmentId: deptId }, status: { not: "RESOLVED" } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { name: true } } },
    }),
  ]);

  const goals = dept?.users.flatMap((u) => u.goalSheets[0]?.goals ?? []) ?? [];
  const sharedLinked = goals.filter((g) => g.sharedGoalId).length;

  return {
    node,
    kpis: [
      { label: "Health Score", value: node.healthScore },
      { label: "Completion", value: `${node.progressPct}%` },
      { label: "Strategic Goals", value: sharedLinked },
      { label: "Escalations", value: escalations.length, trend: escalations.length > 2 ? "down" : "flat" },
    ],
    escalations: escalations.map((e) => ({
      id: e.id,
      title: `${e.employee.name} — ${e.status}`,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
    dependencies: [],
    relatedGoals: goals.slice(0, 6).map((g) => ({
      id: g.id,
      title: g.title,
      progressPct: Math.round(
        ((g.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0]?.progressScore ?? 0) * 100)
      ),
      status: g.achievements[0]?.status ?? "NOT_STARTED",
    })),
    insights: [
      node.healthStatus === "critical"
        ? `${node.label} requires immediate leadership intervention.`
        : `${node.label} alignment contribution at ${node.metrics.alignmentContribution ?? node.progressPct}%.`,
    ],
    recommendations: [
      "Review cross-functional shared goal adoption",
      "Schedule manager effectiveness review for overloaded teams",
    ],
    activity: escalations.slice(0, 3).map((e) => ({
      label: `Escalation: ${e.employee.name}`,
      at: e.createdAt.toISOString(),
    })),
  };
}

async function buildManagerDetail(
  mgrId: string,
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const [mgr, pending, escalations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: mgrId },
      include: {
        directReports: {
          include: {
            goalSheets: {
              where: { cycleId },
              include: { goals: true },
            },
          },
        },
      },
    }),
    prisma.goalSheet.count({
      where: { managerId: mgrId, cycleId, status: "SUBMITTED" },
    }),
    prisma.escalationLog.findMany({
      where: { managerId: mgrId, status: { not: "RESOLVED" } },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    node,
    kpis: [
      { label: "Team Performance", value: `${node.progressPct}%` },
      { label: "Pending Approvals", value: pending, trend: pending > 2 ? "down" : "flat" },
      { label: "Influence Score", value: Number(node.metrics.influence ?? 0) },
      { label: "Escalation Burden", value: Number(node.metrics.escalationCount ?? 0) },
    ],
    escalations: escalations.map((e) => ({
      id: e.id,
      title: `Team escalation — ${e.status}`,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
    dependencies: [],
    relatedGoals: (mgr?.directReports ?? [])
      .flatMap((r) => r.goalSheets[0]?.goals ?? [])
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        title: g.title,
        progressPct: 0,
        status: "ACTIVE",
      })),
    insights: node.isBottleneck
      ? [`${node.label} is an execution bottleneck — approval velocity impacting teams.`]
      : [`${node.label} maintains healthy team execution velocity.`],
    recommendations: pending > 0 ? ["Clear pending approval queue within 48 hours"] : [],
    activity: [],
  };
}

async function buildEmployeeDetail(
  empId: string,
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const sheet = await prisma.goalSheet.findFirst({
    where: { employeeId: empId, cycleId },
    include: {
      goals: {
        include: {
          achievements: { where: { cycleId } },
          sharedGoal: { select: { title: true } },
        },
      },
    },
  });

  const goals = sheet?.goals ?? [];

  return {
    node,
    kpis: [
      { label: "Contribution Score", value: node.progressPct },
      { label: "Goals", value: goals.length },
      { label: "Risk Score", value: Number(node.metrics.riskScore ?? 0) },
      { label: "Shared Goals", value: goals.filter((g) => g.sharedGoalId).length },
    ],
    escalations: [],
    dependencies: [],
    relatedGoals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      progressPct: Math.round(
        ((g.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0]?.progressScore ?? 0) * 100)
      ),
      status: g.achievements[0]?.status ?? "NOT_STARTED",
    })),
    insights: node.isAtRisk
      ? ["Employee flagged at-risk — review check-in cadence and goal feasibility."]
      : ["Execution on track relative to team benchmarks."],
    recommendations: [],
    activity: [],
  };
}

async function buildGoalDetail(
  goalId: string,
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      achievements: { where: { cycleId } },
      sharedGoal: true,
      dependenciesFrom: { include: { toGoal: { select: { id: true, title: true } } } },
      dependenciesTo: { include: { fromGoal: { select: { id: true, title: true } } } },
    },
  });

  if (!goal) return buildGenericDetail(node);

  const deps = [
    ...goal.dependenciesFrom.map((d) => ({
      id: d.id,
      title: d.toGoal.title,
      type: d.type,
      direction: "out" as const,
    })),
    ...goal.dependenciesTo.map((d) => ({
      id: d.id,
      title: d.fromGoal.title,
      type: d.type,
      direction: "in" as const,
    })),
  ];

  return {
    node,
    kpis: [
      { label: "Progress", value: `${node.progressPct}%` },
      { label: "Strategic Link", value: goal.sharedGoalId ? "Yes" : "No" as string },
      { label: "Dependencies", value: deps.length },
      { label: "Status", value: String(node.metrics.status ?? "Active") },
    ],
    escalations: [],
    dependencies: deps,
    relatedGoals: goal.sharedGoal
      ? [{ id: goal.sharedGoal.id, title: goal.sharedGoal.title, progressPct: node.progressPct, status: "SHARED" }]
      : [],
    insights: node.isAtRisk
      ? ["Goal at risk — upstream dependencies may be blocking execution."]
      : ["Goal progressing within expected execution window."],
    recommendations: deps.some((d) => d.type === "BLOCKED_BY")
      ? ["Resolve blocking dependency before next check-in"]
      : [],
    activity: [],
  };
}

async function buildSharedGoalDetail(
  sgId: string,
  node: AlignmentGraphNode,
  cycleId: string
): Promise<NodeDetailPayload> {
  const sg = await prisma.sharedGoal.findUnique({
    where: { id: sgId },
    include: {
      goals: {
        include: {
          goalSheet: { include: { employee: { select: { name: true, department: { select: { name: true } } } } } },
          achievements: { where: { cycleId } },
        },
      },
    },
  });

  const adoption = sg?.goals ?? [];
  const deptSet = new Set(adoption.map((g) => g.goalSheet.employee.department?.name).filter(Boolean));

  return {
    node,
    kpis: [
      { label: "Adoption", value: adoption.length },
      { label: "Progress", value: `${node.progressPct}%` },
      { label: "Departments", value: deptSet.size },
      { label: "Sync Health", value: node.progressPct > 50 ? "Healthy" : "At Risk" },
    ],
    escalations: [],
    dependencies: [],
    relatedGoals: adoption.slice(0, 8).map((g) => ({
      id: g.id,
      title: `${g.goalSheet.employee.name}: ${g.title}`,
      progressPct: Math.round(
        ((g.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0]?.progressScore ?? 0) * 100)
      ),
      status: g.achievements[0]?.status ?? "NOT_STARTED",
    })),
    insights: [
      `Cross-functional collaboration across ${deptSet.size} departments.`,
      adoption.length < 3
        ? "Low adoption — increase manager push and alignment communication."
        : "Strong multi-team ownership signals.",
    ],
    recommendations: ["Review contribution percentages across participating teams"],
    activity: [],
  };
}

function buildGenericDetail(node: AlignmentGraphNode): NodeDetailPayload {
  return {
    node,
    kpis: [
      { label: "Health", value: node.healthScore },
      { label: "Progress", value: `${node.progressPct}%` },
    ],
    escalations: [],
    dependencies: [],
    relatedGoals: [],
    insights: [`${node.label} is a strategic execution anchor for organizational alignment.`],
    recommendations: [],
    activity: [],
  };
}
