import { requireSession } from "@/lib/api-auth";
import { buildRealtimeSnapshot } from "@/lib/realtime/snapshot";
import { getRealtimeVersion } from "@/lib/realtime/events";
import { fetchLiveActivityStream } from "@/lib/realtime/activity-stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 2_500;

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const userId = session.user.id;
  const role = session.user.role;
  let lastVersion = await getRealtimeVersion();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "connected", version: lastVersion });

      const tick = async () => {
        try {
          const version = await getRealtimeVersion();
          if (version !== lastVersion) {
            lastVersion = version;
            const snapshot = await buildRealtimeSnapshot(userId, role);
            send({ type: "update", payload: snapshot });

            const events = await fetchLiveActivityStream({ limit: 3 });
            if (events[0]) {
              send({ type: "event", event: events[0] });
            }
          } else {
            send({ type: "heartbeat", timestamp: new Date().toISOString() });
          }
        } catch {
          /* connection may close */
        }
      };

      await tick();
      const interval = setInterval(tick, POLL_MS);

      const cleanup = () => clearInterval(interval);
      if (typeof AbortSignal !== "undefined") {
        // Client disconnect handled when stream closes
      }
      return cleanup;
    },
    cancel() {
      /* cleared on cancel */
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
