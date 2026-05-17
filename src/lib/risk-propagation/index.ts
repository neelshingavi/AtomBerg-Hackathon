import type { AlignmentGraphEdge, AlignmentGraphNode } from "@/lib/alignment/types";

export function propagateRisk(
  nodes: AlignmentGraphNode[],
  edges: AlignmentGraphEdge[],
  seedNodeIds: string[]
): { nodes: AlignmentGraphNode[]; edges: AlignmentGraphEdge[]; affectedIds: Set<string> } {
  const affectedIds = new Set<string>(seedNodeIds);
  const adjacency = buildAdjacency(edges);
  const queue = [...seedNodeIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) ?? [];
    for (const next of neighbors) {
      if (!affectedIds.has(next)) {
        affectedIds.add(next);
        queue.push(next);
      }
    }
  }

  const updatedNodes = nodes.map((n) => ({
    ...n,
    isPropagatingRisk: affectedIds.has(n.id) && seedNodeIds.includes(n.id) === false,
    isAtRisk: affectedIds.has(n.id) || n.isAtRisk,
  }));

  const updatedEdges = edges.map((e) => ({
    ...e,
    animated: affectedIds.has(e.source) && affectedIds.has(e.target),
    type: affectedIds.has(e.source) && affectedIds.has(e.target) ? ("risk_propagation" as const) : e.type,
  }));

  return { nodes: updatedNodes, edges: updatedEdges, affectedIds };
}

function buildAdjacency(edges: AlignmentGraphEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    const fwd = map.get(e.source) ?? [];
    fwd.push(e.target);
    map.set(e.source, fwd);
    const rev = map.get(e.target) ?? [];
    rev.push(e.source);
    map.set(e.target, rev);
  }
  return map;
}

export function findRiskSeeds(nodes: AlignmentGraphNode[]): string[] {
  return nodes
    .filter(
      (n) =>
        n.healthStatus === "critical" ||
        n.healthStatus === "blocker" ||
        n.riskLevel === "high" ||
        n.riskLevel === "critical"
    )
    .map((n) => n.id);
}
