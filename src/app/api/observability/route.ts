import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { getObservabilitySummary } from "@/lib/observability/tracker";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const summary = await getObservabilitySummary();
  return apiSuccess(summary);
}
