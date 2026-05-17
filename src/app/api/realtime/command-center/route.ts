import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildCommandCenterLive } from "@/lib/realtime/command-center";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  const rErr = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (rErr) return rErr;

  const data = await buildCommandCenterLive();
  return apiSuccess(data);
}
