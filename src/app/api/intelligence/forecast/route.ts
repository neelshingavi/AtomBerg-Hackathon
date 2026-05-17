import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildPredictiveSnapshot } from "@/lib/predictive-engine";
import type { ForecastHorizon } from "@/lib/predictive-engine/types";

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

  const horizon = (req.nextUrl.searchParams.get("horizon") ?? "quarter") as ForecastHorizon;
  const snapshot = await buildPredictiveSnapshot(cycleId, horizon);
  return apiSuccess(snapshot);
}
