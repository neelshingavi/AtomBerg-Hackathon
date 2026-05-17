import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildAlignmentGraph } from "@/lib/alignment/build-graph";
import { getCached, setCache } from "@/lib/intelligence/cache";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  let cycleId = req.nextUrl.searchParams.get("cycleId");
  if (!cycleId) {
    const active = await prisma.systemConfig.findUnique({
      where: { key: "active_cycle_id" },
    });
    cycleId = active?.value ?? null;
  }
  if (!cycleId) return apiError("cycleId is required");

  const expand = req.nextUrl.searchParams.get("expand") === "true";
  const cacheKey = `alignment:graph:${cycleId}:${expand}`;
  const cached = getCached<Awaited<ReturnType<typeof buildAlignmentGraph>>>(cacheKey);
  if (cached) return apiSuccess(cached);

  const payload = await buildAlignmentGraph(cycleId, {
    expandEmployees: expand,
    includeGoals: true,
  });

  setCache(cacheKey, payload, 60_000);
  return apiSuccess(payload);
}
