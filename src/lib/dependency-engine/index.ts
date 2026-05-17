import { prisma } from "@/lib/prisma";
import type { AlignmentGraphEdge } from "@/lib/alignment/types";

export type DependencyChain = {
  goalId: string;
  title: string;
  chain: Array<{ goalId: string; title: string; type: string }>;
  isBlocked: boolean;
};

export async function loadDependencies(cycleId: string) {
  return prisma.goalDependency.findMany({
    where: { cycleId },
    include: {
      fromGoal: { select: { id: true, title: true, goalSheetId: true } },
      toGoal: { select: { id: true, title: true, goalSheetId: true } },
    },
  });
}

export function dependenciesToEdges(
  deps: Awaited<ReturnType<typeof loadDependencies>>
): AlignmentGraphEdge[] {
  return deps.map((d) => ({
    id: `dep-${d.id}`,
    source: `goal-${d.fromGoalId}`,
    target: `goal-${d.toGoalId}`,
    type: "dependency" as const,
    label: formatDepType(d.type),
    dependencyType: d.type,
    isBlocked: d.type === "BLOCKED_BY",
    isCriticalPath: d.isCritical,
    animated: d.type === "BLOCKED_BY",
  }));
}

function formatDepType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase();
}

export function findCriticalPaths(
  deps: Awaited<ReturnType<typeof loadDependencies>>,
  atRiskGoalIds: Set<string>
): Set<string> {
  const blocked = new Set<string>();
  for (const d of deps) {
    if (d.type === "BLOCKED_BY" && atRiskGoalIds.has(d.toGoalId)) {
      blocked.add(d.fromGoalId);
    }
  }
  return blocked;
}

export async function buildDependencyChains(cycleId: string): Promise<DependencyChain[]> {
  const deps = await loadDependencies(cycleId);
  const goals = await prisma.goal.findMany({
    where: { goalSheet: { cycleId } },
    select: { id: true, title: true },
  });
  const titleMap = new Map(goals.map((g) => [g.id, g.title]));

  const byFrom = new Map<string, typeof deps>();
  for (const d of deps) {
    const list = byFrom.get(d.fromGoalId) ?? [];
    list.push(d);
    byFrom.set(d.fromGoalId, list);
  }

  const chains: DependencyChain[] = [];
  for (const g of goals) {
    const outgoing = byFrom.get(g.id) ?? [];
    if (outgoing.length === 0) continue;
    chains.push({
      goalId: g.id,
      title: g.title,
      chain: outgoing.map((d) => ({
        goalId: d.toGoalId,
        title: titleMap.get(d.toGoalId) ?? "Unknown",
        type: d.type,
      })),
      isBlocked: outgoing.some((d) => d.type === "BLOCKED_BY"),
    });
  }
  return chains.slice(0, 50);
}
