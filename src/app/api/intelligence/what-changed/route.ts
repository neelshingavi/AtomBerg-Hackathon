import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildIntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { buildWhatChanged } from "@/lib/ai/what-changed";
import { prisma } from "@/lib/prisma";

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

  const snapshot = await buildIntelligenceSnapshot(cycleId);
  const data = buildWhatChanged(snapshot);
  return apiSuccess(data);
}
