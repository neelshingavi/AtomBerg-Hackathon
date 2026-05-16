import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/cycle";
import { buildExecutiveReport } from "@/lib/reports/executive";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const cycleId =
    req.nextUrl.searchParams.get("cycleId") ?? (await getActiveCycle())?.id;

  if (!cycleId) return apiError("cycleId is required");

  const data = await buildExecutiveReport(cycleId);

  const cycle = await prisma.goalCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, fiscalYear: true, currentPhase: true },
  });

  return apiSuccess({ cycle, ...data });
}
