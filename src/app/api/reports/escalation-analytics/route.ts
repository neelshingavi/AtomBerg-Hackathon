import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildEscalationAnalytics } from "@/lib/reports/escalation-analytics";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const departmentId = req.nextUrl.searchParams.get("departmentId") ?? undefined;
  const cycleId = req.nextUrl.searchParams.get("cycleId") ?? undefined;

  const data = await buildEscalationAnalytics({ cycleId, departmentId });
  return apiSuccess(data);
}
