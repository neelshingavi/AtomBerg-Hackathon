import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { buildIntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { runScenario, PRESET_SCENARIOS } from "@/lib/predictive-engine";
import type { ScenarioInput } from "@/lib/predictive-engine/types";

export async function GET() {
  return apiSuccess({ presets: PRESET_SCENARIOS });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const body = (await req.json()) as { cycleId?: string; input?: ScenarioInput };
  let cycleId = body.cycleId;
  if (!cycleId) {
    const active = await prisma.systemConfig.findUnique({
      where: { key: "active_cycle_id" },
    });
    cycleId = active?.value ?? undefined;
  }
  if (!cycleId) return apiError("cycleId is required");
  if (!body.input) return apiError("input is required");

  const snapshot = await buildIntelligenceSnapshot(cycleId);
  const result = runScenario(snapshot, body.input);
  return apiSuccess(result);
}
