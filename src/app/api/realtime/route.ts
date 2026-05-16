import { apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { buildRealtimeSnapshot } from "@/lib/realtime/snapshot";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const snapshot = await buildRealtimeSnapshot(
    session.user.id,
    session.user.role
  );
  return apiSuccess(snapshot);
}
