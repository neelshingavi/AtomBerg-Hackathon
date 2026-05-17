import dagre from "@dagrejs/dagre";
import type { AlignmentGraphNode, AlignmentGraphEdge } from "@/lib/alignment/types";

const NODE_WIDTH: Record<string, number> = {
  strategic_objective: 220,
  initiative_cluster: 200,
  shared_goal: 180,
  department: 170,
  manager: 150,
  employee: 120,
  goal: 140,
};

const NODE_HEIGHT: Record<string, number> = {
  strategic_objective: 80,
  initiative_cluster: 70,
  shared_goal: 70,
  department: 65,
  manager: 60,
  employee: 50,
  goal: 55,
};

export function applyDagreLayout(
  nodes: AlignmentGraphNode[],
  edges: AlignmentGraphEdge[],
  direction: "TB" | "LR" = "TB"
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    if (node.hidden) continue;
    g.setNode(node.id, {
      width: NODE_WIDTH[node.type] ?? 140,
      height: NODE_HEIGHT[node.type] ?? 60,
    });
  }

  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    if (node.hidden) continue;
    const n = g.node(node.id);
    if (n) {
      positions.set(node.id, {
        x: n.x - (NODE_WIDTH[node.type] ?? 140) / 2,
        y: n.y - (NODE_HEIGHT[node.type] ?? 60) / 2,
      });
    }
  }
  return positions;
}

export function clusterPositions(
  nodes: AlignmentGraphNode[],
  basePositions: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  const result = new Map(basePositions);
  const byCluster = new Map<string, AlignmentGraphNode[]>();
  for (const n of nodes) {
    if (!n.clusterId) continue;
    const list = byCluster.get(n.clusterId) ?? [];
    list.push(n);
    byCluster.set(n.clusterId, list);
  }
  let offsetX = 0;
  for (const [, clusterNodes] of Array.from(byCluster.entries())) {
    for (let i = 0; i < clusterNodes.length; i++) {
      const pos = result.get(clusterNodes[i].id);
      if (pos) {
        result.set(clusterNodes[i].id, { x: pos.x + offsetX, y: pos.y + i * 20 });
      }
    }
    offsetX += 30;
  }
  return result;
}
