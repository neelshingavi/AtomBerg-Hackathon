"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { RealtimeEventPayload, LiveStreamEvent } from "@/lib/realtime/types";

export function useRealtimeStream(enabled = true) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveStreamEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user) return;

    const es = new EventSource("/api/realtime/stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as
          | { type: "connected" }
          | { type: "update"; payload: RealtimeEventPayload }
          | { type: "event"; event: LiveStreamEvent }
          | { type: "heartbeat" };

        if (data.type === "update") {
          void qc.invalidateQueries({ queryKey: ["notifications"] });
          void qc.invalidateQueries({ queryKey: ["activity-feed"] });
          void qc.invalidateQueries({ queryKey: ["activity-center"] });
          void qc.invalidateQueries({ queryKey: ["live-activity-stream"] });
          void qc.invalidateQueries({ queryKey: ["command-center-live"] });
          void qc.invalidateQueries({ queryKey: ["operational-alerts"] });
          void qc.invalidateQueries({ queryKey: ["realtime"] });
          void qc.invalidateQueries({ queryKey: ["intelligence"] });
        }
        if (data.type === "event") {
          setLastEvent(data.event);
        }
      } catch {
        /* ignore parse errors */
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [enabled, session?.user, qc]);

  return { connected, lastEvent };
}
