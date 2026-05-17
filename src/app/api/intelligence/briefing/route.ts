import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { generateExecutiveBriefing } from "@/lib/ai/summaries";
import { logAiGeneration } from "@/lib/ai/audit";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  let cycleId = req.nextUrl.searchParams.get("cycleId");
  const type = (req.nextUrl.searchParams.get("type") ?? "organization") as
    | "organization"
    | "department"
    | "escalation"
    | "risk";

  if (!cycleId) {
    const active = await prisma.systemConfig.findUnique({
      where: { key: "active_cycle_id" },
    });
    cycleId = active?.value ?? null;
  }
  if (!cycleId) return apiError("cycleId is required");

  const briefing = await generateExecutiveBriefing(cycleId, type);
  void logAiGeneration({
    type: "briefing",
    userId: session.user.id,
    cycleId,
    summary: briefing.summary,
    metadata: { type },
    confidence: 88,
  });

  return apiSuccess(briefing);
}
