"use client";

import { createContext, useContext } from "react";
import { useRealtimePoll } from "@/hooks/useRealtime";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { usePresenceHeartbeat } from "@/hooks/usePresence";

type RealtimeStatus = {
  connected: boolean;
  reconnecting: boolean;
};

const RealtimeStatusContext = createContext<RealtimeStatus>({
  connected: false,
  reconnecting: false,
});

export function useRealtimeStatus() {
  return useContext(RealtimeStatusContext);
}

/** Mount once in app shell — SSE stream + poll fallback + presence heartbeat. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimePoll(true);
  const { connected, reconnecting } = useRealtimeStream(true);
  usePresenceHeartbeat();

  return (
    <RealtimeStatusContext.Provider value={{ connected, reconnecting }}>
      {children}
    </RealtimeStatusContext.Provider>
  );
}
