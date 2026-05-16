import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildOperationsFeed } from "@/lib/reports/operations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const data = await buildOperationsFeed();
  return apiSuccess(data);
}
