import type { AlignmentGraphNode, AlignmentGraphEdge, AlignmentScores, BottleneckItem } from "@/lib/alignment/types";

export function computeAlignmentScores(
  nodes: AlignmentGraphNode[],
  edges: AlignmentGraphEdge[]
): AlignmentScores {
  const goals = nodes.filter((n) => n.type === "goal");
  const sharedGoals = nodes.filter((n) => n.type === "shared_goal");
  const departments = nodes.filter((n) => n.type === "department");
  const depEdges = edges.filter((e) => e.type === "dependency");
  const collabEdges = edges.filter((e) => e.type === "collaboration" || e.type === "shared_ownership");

  const linkedGoals = goals.filter((g) => g.metrics.hasStrategicLink === true);
  const strategicLinkage =
    goals.length > 0 ? Math.round((linkedGoals.length / goals.length) * 100) : 0;

  const crossDeptCollab = collabEdges.length;
  const maxPossible = Math.max(1, departments.length * (departments.length - 1));
  const crossFunctionalCollaboration = Math.min(100, Math.round((crossDeptCollab / maxPossible) * 100));

  const orphanGoals = goals.filter((g) => !g.parentId && !g.metrics.hasStrategicLink);
  const orphanGoalRate = goals.length > 0 ? Math.round((orphanGoals.length / goals.length) * 100) : 0;

  const siloedDepts = departments.filter(
    (d) => !edges.some((e) => e.source === d.id && e.type === "collaboration")
  );
  const siloIndex =
    departments.length > 0 ? Math.round((siloedDepts.length / departments.length) * 100) : 0;

  const blockedDeps = depEdges.filter((e) => e.isBlocked).length;
  const dependencyHealth =
    depEdges.length > 0
      ? Math.max(0, 100 - Math.round((blockedDeps / depEdges.length) * 100))
      : 100;

  const withProgress = goals.filter((g) => g.progressPct > 0);
  const contributionCoverage =
    goals.length > 0 ? Math.round((withProgress.length / goals.length) * 100) : 0;

  const overallScore = Math.round(
    strategicLinkage * 0.25 +
      crossFunctionalCollaboration * 0.2 +
      (100 - orphanGoalRate) * 0.15 +
      (100 - siloIndex) * 0.15 +
      dependencyHealth * 0.15 +
      contributionCoverage * 0.1
  );

  const insights = generateInsights({
    strategicLinkage,
    crossFunctionalCollaboration,
    orphanGoalRate,
    siloIndex,
    departments,
    sharedGoals,
  });

  const bottlenecks = detectBottlenecks(nodes, edges);

  return {
    overallScore,
    strategicLinkage,
    crossFunctionalCollaboration,
    orphanGoalRate,
    siloIndex,
    dependencyHealth,
    contributionCoverage,
    insights,
    bottlenecks,
  };
}

function generateInsights(params: {
  strategicLinkage: number;
  crossFunctionalCollaboration: number;
  orphanGoalRate: number;
  siloIndex: number;
  departments: AlignmentGraphNode[];
  sharedGoals: AlignmentGraphNode[];
}): string[] {
  const insights: string[] = [];
  if (params.strategicLinkage < 60) {
    insights.push("Multiple operational goals lack strategic linkage to company priorities.");
  }
  if (params.orphanGoalRate > 20) {
    insights.push(`${params.orphanGoalRate}% of goals are orphaned from strategic objectives.`);
  }
  if (params.siloIndex > 40) {
    insights.push("Several departments show limited cross-functional collaboration signals.");
  }
  const topDept = [...params.departments].sort((a, b) => b.healthScore - a.healthScore)[0];
  if (topDept) {
    insights.push(`${topDept.label} demonstrates strongest alignment density (${topDept.healthScore}/100).`);
  }
  if (params.crossFunctionalCollaboration < 50) {
    insights.push("Finance and Operations collaboration coverage is below enterprise target.");
  }
  if (params.sharedGoals.length > 0) {
    const avgShared =
      params.sharedGoals.reduce((s, g) => s + g.progressPct, 0) / params.sharedGoals.length;
    insights.push(
      `Shared organizational goals average ${Math.round(avgShared)}% execution progress.`
    );
  }
  if (insights.length === 0) {
    insights.push("Organization alignment is within healthy enterprise thresholds.");
  }
  return insights;
}

function detectBottlenecks(
  nodes: AlignmentGraphNode[],
  edges: AlignmentGraphEdge[]
): BottleneckItem[] {
  const items: BottleneckItem[] = [];

  for (const m of nodes.filter((n) => n.type === "manager")) {
    const esc = Number(m.metrics.escalationCount ?? 0);
    const pending = Number(m.metrics.pendingApprovals ?? 0);
    if (esc >= 2 || pending >= 3) {
      items.push({
        id: `bn-mgr-${m.id}`,
        type: "manager",
        title: `Overloaded: ${m.label}`,
        description: `${esc} escalations, ${pending} pending approvals`,
        severity: esc >= 4 ? "high" : "medium",
        nodeId: m.id,
      });
    }
  }

  for (const e of edges.filter((ed) => ed.isBlocked)) {
    items.push({
      id: `bn-dep-${e.id}`,
      type: "dependency",
      title: "Blocked dependency chain",
      description: e.label ?? "Goal blocked by upstream dependency",
      severity: "high",
      nodeId: e.target,
    });
  }

  for (const sg of nodes.filter((n) => n.type === "shared_goal" && n.progressPct < 40)) {
    items.push({
      id: `bn-strat-${sg.id}`,
      type: "strategic",
      title: `Delayed initiative: ${sg.label}`,
      description: `Strategic shared goal at ${sg.progressPct}% progress`,
      severity: sg.progressPct < 25 ? "high" : "medium",
      nodeId: sg.id,
    });
  }

  for (const d of nodes.filter((n) => n.type === "department" && n.healthStatus === "critical")) {
    items.push({
      id: `bn-team-${d.id}`,
      type: "team",
      title: `Isolated team risk: ${d.label}`,
      description: "Department health below critical threshold",
      severity: "high",
      nodeId: d.id,
    });
  }

  return items.slice(0, 12);
}
