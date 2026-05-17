import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { acknowledgeAlert, listActiveAlerts } from "@/lib/realtime/alerts";
import { bumpRealtimeVersion } from "@/lib/realtime/events";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  const rErr = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (rErr) return rErr;

  const alerts = await listActiveAlerts(30);
  return apiSuccess({ alerts });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const rErr = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (rErr) return rErr;

  const body = await req.json();
  const alertId = body.alertId as string;
  if (!alertId) return apiError("alertId required");

  await acknowledgeAlert(alertId, session.user.id);
  await bumpRealtimeVersion("alert_ack");
  return apiSuccess({ ok: true });
}
