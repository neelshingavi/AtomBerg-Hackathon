"use client";

import { useRealtimePoll } from "@/hooks/useRealtime";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { usePresenceHeartbeat } from "@/hooks/usePresence";

/** Mount once in app shell — SSE stream + poll fallback + presence heartbeat. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimePoll(true);
  useRealtimeStream(true);
  usePresenceHeartbeat();
  return <>{children}</>;
}
