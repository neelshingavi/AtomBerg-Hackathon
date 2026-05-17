import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildAlignmentGraph } from "@/lib/alignment/build-graph";
import { buildNodeDetail } from "@/lib/alignment/node-detail";
import type { AlignmentGraphNode } from "@/lib/alignment/types";

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const body = (await req.json()) as { nodeId: string; cycleId?: string; node?: AlignmentGraphNode };
  if (!body.nodeId && !body.node) return apiError("nodeId or node is required");

  let cycleId = body.cycleId;
  if (!cycleId) {
    const active = await prisma.systemConfig.findUnique({
      where: { key: "active_cycle_id" },
    });
    cycleId = active?.value ?? undefined;
  }
  if (!cycleId) return apiError("cycleId is required");

  let node = body.node;
  if (!node) {
    const graph = await buildAlignmentGraph(cycleId);
    node = graph.nodes.find((n) => n.id === body.nodeId);
    if (!node) return apiError("Node not found", 404);
  }

  const detail = await buildNodeDetail(node, cycleId);
  return apiSuccess(detail);
}
