import { prisma } from "@/lib/prisma";
import { loadDependencies, dependenciesToEdges } from "@/lib/dependency-engine";
import { computeEmployeeRisks, computeDepartmentRisks, computeManagerRisks } from "@/lib/risk/engine";
import { propagateRisk, findRiskSeeds } from "@/lib/risk-propagation";
import { computeAlignmentScores } from "@/lib/alignment-scoring";
import { STRATEGIC_INITIATIVES } from "./types";
import type {
  AlignmentGraphNode,
  AlignmentGraphEdge,
  AlignmentGraphPayload,
  AlignmentScores,
} from "./types";
import {
  avgProgress,
  computeHealthFromProgress,
  riskToLevel,
  scoreToHealthStatus,
} from "./health";

const STRATEGIC_OBJECTIVES = [
  { id: "so-revenue", label: "Revenue Growth", thrustAreaIds: ["ta-business-growth"], color: "#10b981" },
  { id: "so-efficiency", label: "Operational Efficiency", thrustAreaIds: ["ta-efficiency", "ta-quality"], color: "#6366f1" },
  { id: "so-innovation", label: "Product Innovation", thrustAreaIds: ["ta-innovation"], color: "#8b5cf6" },
  { id: "so-workforce", label: "Workforce Excellence", thrustAreaIds: ["ta-people"], color: "#ec4899" },
] as const;

const MAX_EMPLOYEES_PER_MANAGER = 6;
const MAX_GOALS_PER_EMPLOYEE = 3;

export type BuildGraphOptions = {
  expandEmployees?: boolean;
  includeGoals?: boolean;
};

export async function buildAlignmentGraph(
  cycleId: string,
  options: BuildGraphOptions = {}
): Promise<AlignmentGraphPayload & { scores: AlignmentScores }> {
  const { expandEmployees = false, includeGoals = true } = options;

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const [
    departments,
    sharedGoals,
    dependencies,
    deptRisks,
    empRisks,
    mgrRisks,
    escalations,
  ] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: { isActive: true, role: { in: ["MANAGER", "EMPLOYEE"] } },
          select: {
            id: true,
            name: true,
            role: true,
            managerId: true,
            goalSheets: {
              where: { cycleId },
              select: {
                status: true,
                goals: {
                  include: {
                    achievements: { where: { cycleId } },
                    thrustArea: { select: { id: true, name: true, color: true } },
                    sharedGoal: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.sharedGoal.findMany({
      where: { cycleId, isActive: true },
      include: {
        thrustArea: true,
        department: { select: { id: true, name: true } },
        goals: { include: { achievements: { where: { cycleId } } } },
      },
    }),
    loadDependencies(cycleId),
    computeDepartmentRisks(cycleId),
    computeEmployeeRisks({ cycleId, limit: 200 }),
    computeManagerRisks(cycleId),
    prisma.escalationLog.groupBy({
      by: ["employeeId"],
      where: { status: { not: "RESOLVED" } },
      _count: true,
    }),
  ]);

  const escalationByEmployee = new Map(escalations.map((e) => [e.employeeId, e._count]));
  const deptRiskMap = new Map(deptRisks.map((d) => [d.id, d]));
  const empRiskMap = new Map(empRisks.map((e) => [e.id, e]));
  const mgrRiskMap = new Map(mgrRisks.map((m) => [m.id, m]));

  const nodes: AlignmentGraphNode[] = [];
  const edges: AlignmentGraphEdge[] = [];

  for (const obj of STRATEGIC_OBJECTIVES) {
    const linkedShared = sharedGoals.filter((sg) =>
      (obj.thrustAreaIds as readonly string[]).includes(sg.thrustAreaId)
    );
    const progress =
      linkedShared.length > 0
        ? Math.round(linkedShared.reduce((s, g) => s + sharedGoalProgress(g), 0) / linkedShared.length)
        : 0;
    const healthScore = computeHealthFromProgress(progress);
    nodes.push({
      id: obj.id,
      type: "strategic_objective",
      label: obj.label,
      subtitle: `${linkedShared.length} linked initiatives`,
      healthScore,
      healthStatus: scoreToHealthStatus(healthScore),
      progressPct: progress,
      metrics: { linkedInitiatives: linkedShared.length, thrustAreas: obj.thrustAreaIds.length },
    });
  }

  for (const init of STRATEGIC_INITIATIVES) {
    const matching = sharedGoals.filter((sg) =>
      (init.thrustAreaIds as readonly string[]).includes(sg.thrustAreaId)
    );
    const progress =
      matching.length > 0
        ? Math.round(matching.reduce((s, g) => s + sharedGoalProgress(g), 0) / matching.length)
        : 0;
    const healthScore = computeHealthFromProgress(progress);
    nodes.push({
      id: init.id,
      type: "initiative_cluster",
      label: init.label,
      subtitle: `${matching.length} shared goals`,
      healthScore,
      healthStatus: scoreToHealthStatus(healthScore),
      progressPct: progress,
      clusterId: init.id,
      metrics: { goalCount: matching.length },
    });
    for (const obj of STRATEGIC_OBJECTIVES) {
      if (obj.thrustAreaIds.some((ta) => (init.thrustAreaIds as readonly string[]).includes(ta))) {
        edges.push({
          id: `strat-${obj.id}-${init.id}`,
          source: obj.id,
          target: init.id,
          type: "strategic_link",
          label: "drives",
        });
      }
    }
  }

  for (const sg of sharedGoals) {
    const progress = sharedGoalProgress(sg);
    const healthScore = computeHealthFromProgress(progress);
    const objId = STRATEGIC_OBJECTIVES.find((o) =>
      (o.thrustAreaIds as readonly string[]).includes(sg.thrustAreaId)
    )?.id;
    const initId = STRATEGIC_INITIATIVES.find((i) =>
      (i.thrustAreaIds as readonly string[]).includes(sg.thrustAreaId)
    )?.id;

    nodes.push({
      id: `sg-${sg.id}`,
      type: "shared_goal",
      label: sg.title,
      subtitle: sg.thrustArea.name,
      healthScore,
      healthStatus: scoreToHealthStatus(healthScore),
      progressPct: progress,
      entityId: sg.id,
      parentId: initId,
      clusterId: initId,
      isAtRisk: progress < 35,
      metrics: {
        thrustArea: sg.thrustArea.name,
        department: sg.department?.name ?? "Organization-wide",
        adoptionCount: sg.goals?.length ?? 0,
      },
    });

    if (objId) {
      edges.push({
        id: `link-${objId}-sg-${sg.id}`,
        source: objId,
        target: `sg-${sg.id}`,
        type: "strategic_link",
        animated: progress < 35,
      });
    }
    if (initId) {
      edges.push({
        id: `init-${initId}-sg-${sg.id}`,
        source: initId,
        target: `sg-${sg.id}`,
        type: "strategic_link",
      });
    }
  }

  const deptCollabPairs = new Set<string>();

  for (const dept of departments) {
    const risk = deptRiskMap.get(dept.id);
    const allGoals = dept.users.flatMap((u) => u.goalSheets[0]?.goals ?? []);
    const progress = avgProgress(allGoals.flatMap((g) => g.achievements));
    const escCount = dept.users.reduce(
      (s, u) => s + (escalationByEmployee.get(u.id) ?? 0),
      0
    );
    const healthScore = computeHealthFromProgress(progress, countAtRisk(allGoals), escCount);
    const riskScore = risk?.score ?? 0;

    nodes.push({
      id: `dept-${dept.id}`,
      type: "department",
      label: dept.name,
      subtitle: `${dept.users.filter((u) => u.role === "EMPLOYEE").length} employees`,
      healthScore,
      healthStatus: scoreToHealthStatus(healthScore),
      progressPct: progress,
      riskLevel: riskToLevel(riskScore),
      entityId: dept.id,
      isAtRisk: healthScore < 50,
      metrics: {
        completionPct: progress,
        escalationCount: escCount,
        alignmentContribution: Math.round(progress * 0.85),
        employeeCount: dept.users.filter((u) => u.role === "EMPLOYEE").length,
      },
    });

    for (const sg of sharedGoals) {
      const linked = allGoals.some((g) => g.sharedGoalId === sg.id);
      if (linked) {
        edges.push({
          id: `collab-dept-${dept.id}-sg-${sg.id}`,
          source: `dept-${dept.id}`,
          target: `sg-${sg.id}`,
          type: "shared_ownership",
          strength: 1,
        });
        const objId = STRATEGIC_OBJECTIVES.find((o) =>
          (o.thrustAreaIds as readonly string[]).includes(sg.thrustAreaId)
        )?.id;
        if (objId) {
          const pairKey = [dept.id, objId].sort().join(":");
          if (!deptCollabPairs.has(pairKey)) {
            deptCollabPairs.add(pairKey);
            edges.push({
              id: `collab-${dept.id}-${objId}`,
              source: `dept-${dept.id}`,
              target: objId,
              type: "collaboration",
              strength: 0.5,
            });
          }
        }
      }
    }

    const managers = dept.users.filter((u) => u.role === "MANAGER");
    for (const mgr of managers) {
      const mgrRisk = mgrRiskMap.get(mgr.id);
      const reports = dept.users.filter((u) => u.managerId === mgr.id && u.role === "EMPLOYEE");
      const teamGoals = reports.flatMap((r) => r.goalSheets[0]?.goals ?? []);
      const teamProgress = avgProgress(teamGoals.flatMap((g) => g.achievements));
      const pendingApprovals = dept.users.filter((u) => {
        const sheet = u.goalSheets[0];
        return sheet && "status" in sheet && sheet.status === "SUBMITTED" && u.managerId === mgr.id;
      }).length;
      const mgrEsc = reports.reduce((s, r) => s + (escalationByEmployee.get(r.id) ?? 0), 0);
      const mgrHealth = computeHealthFromProgress(teamProgress, 0, mgrEsc);
      const influence = Math.min(100, reports.length * 8 + teamProgress * 0.5);

      nodes.push({
        id: `mgr-${mgr.id}`,
        type: "manager",
        label: mgr.name,
        subtitle: `${reports.length} direct reports`,
        healthScore: mgrHealth,
        healthStatus: scoreToHealthStatus(mgrHealth),
        progressPct: teamProgress,
        riskLevel: mgrRisk ? riskToLevel(mgrRisk.score) : "low",
        entityId: mgr.id,
        parentId: `dept-${dept.id}`,
        isBottleneck: mgrEsc >= 2 || pendingApprovals >= 3,
        metrics: {
          teamPerformance: teamProgress,
          pendingApprovals,
          escalationCount: mgrEsc,
          influence: Math.round(influence),
          approvalVelocity: Math.max(0, 100 - pendingApprovals * 15),
        },
      });

      edges.push({
        id: `hier-dept-${dept.id}-mgr-${mgr.id}`,
        source: `dept-${dept.id}`,
        target: `mgr-${mgr.id}`,
        type: "org_hierarchy",
      });

      const empSlice = expandEmployees ? reports : reports.slice(0, MAX_EMPLOYEES_PER_MANAGER);
      for (const emp of empSlice) {
        const empRisk = empRiskMap.get(emp.id);
        const goals = emp.goalSheets[0]?.goals ?? [];
        const empProgress = avgProgress(goals.flatMap((g) => g.achievements));
        const empEsc = escalationByEmployee.get(emp.id) ?? 0;
        const empHealth = computeHealthFromProgress(empProgress, countAtRisk(goals), empEsc);

        nodes.push({
          id: `emp-${emp.id}`,
          type: "employee",
          label: emp.name,
          subtitle: `${goals.length} goals`,
          healthScore: empHealth,
          healthStatus: scoreToHealthStatus(empHealth),
          progressPct: empProgress,
          riskLevel: empRisk ? riskToLevel(empRisk.score) : "low",
          entityId: emp.id,
          parentId: `mgr-${mgr.id}`,
          isAtRisk: (empRisk?.score ?? 0) >= 50,
          metrics: {
            contributionScore: empProgress,
            goalCompletion: empProgress,
            riskScore: empRisk?.score ?? 0,
            collaborationActivity: goals.filter((g) => g.sharedGoalId).length,
          },
        });

        edges.push({
          id: `hier-mgr-${mgr.id}-emp-${emp.id}`,
          source: `mgr-${mgr.id}`,
          target: `emp-${emp.id}`,
          type: "org_hierarchy",
        });

        if (includeGoals) {
          const goalSlice = goals.slice(0, MAX_GOALS_PER_EMPLOYEE);
          for (const goal of goalSlice) {
            const gProgress = avgProgress(goal.achievements);
            const atRisk = goal.achievements.some((a) => a.status === "AT_RISK");
            const gHealth = computeHealthFromProgress(gProgress, atRisk ? 1 : 0);

            nodes.push({
              id: `goal-${goal.id}`,
              type: "goal",
              label: goal.title.length > 42 ? `${goal.title.slice(0, 40)}…` : goal.title,
              subtitle: goal.thrustArea.name,
              healthScore: gHealth,
              healthStatus: atRisk ? "critical" : scoreToHealthStatus(gHealth),
              progressPct: gProgress,
              entityId: goal.id,
              parentId: `emp-${emp.id}`,
              isAtRisk: atRisk || gProgress < 30,
              metrics: {
                hasStrategicLink: !!goal.sharedGoalId,
                thrustArea: goal.thrustArea.name,
                sharedGoalTitle: goal.sharedGoal?.title ?? "",
                status: goal.achievements.sort((a, b) => b.quarter.localeCompare(a.quarter))[0]?.status ?? "NOT_STARTED",
              },
            });

            edges.push({
              id: `hier-emp-${emp.id}-goal-${goal.id}`,
              source: `emp-${emp.id}`,
              target: `goal-${goal.id}`,
              type: "org_hierarchy",
            });

            if (goal.sharedGoalId) {
              edges.push({
                id: `own-goal-${goal.id}-sg-${goal.sharedGoalId}`,
                source: `goal-${goal.id}`,
                target: `sg-${goal.sharedGoalId}`,
                type: "shared_ownership",
                strength: 1,
              });
            }
          }
        }
      }
    }
  }

  const depEdges = dependenciesToEdges(dependencies);
  edges.push(...depEdges);

  let finalNodes = nodes;
  let finalEdges = edges;
  const seeds = findRiskSeeds(nodes);
  if (seeds.length > 0) {
    const propagated = propagateRisk(nodes, edges, seeds);
    finalNodes = propagated.nodes;
    finalEdges = propagated.edges;
  }

  const scores = computeAlignmentScores(finalNodes, finalEdges);

  const clusters = STRATEGIC_INITIATIVES.map((init) => ({
    id: init.id,
    label: init.label,
    nodeIds: finalNodes.filter((n) => n.clusterId === init.id).map((n) => n.id),
  }));

  return {
    nodes: finalNodes,
    edges: finalEdges,
    clusters,
    scores,
    meta: {
      cycleId,
      cycleName: cycle.name,
      generatedAt: new Date().toISOString(),
      nodeCount: finalNodes.length,
      edgeCount: finalEdges.length,
    },
  };
}

function sharedGoalProgress(sg: {
  goals?: { achievements: { progressScore: number | null; quarter: string }[] }[];
}): number {
  const linked = sg.goals ?? [];
  if (linked.length === 0) return 0;
  const scores = linked.map((g) => avgProgress(g.achievements));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function countAtRisk(
  goals: Array<{ achievements: Array<{ status?: string }> }>
): number {
  return goals.filter((g) => g.achievements.some((a) => a.status === "AT_RISK")).length;
}
