"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { RealtimeEventPayload, LiveStreamEvent } from "@/lib/realtime/types";

const MAX_RECONNECT_DELAY_MS = 30_000;

export function useRealtimeStream(enabled = true) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveStreamEvent | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !session?.user) return;

    const connect = () => {
      if (esRef.current) {
        esRef.current.close();
      }

      setReconnecting(attemptRef.current > 0);
      const es = new EventSource("/api/realtime/stream");
      esRef.current = es;

      es.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
        setReconnecting(false);
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;

        const delay = Math.min(1000 * 2 ** attemptRef.current, MAX_RECONNECT_DELAY_MS);
        attemptRef.current += 1;
        setReconnecting(true);
        timerRef.current = setTimeout(connect, delay);
      };

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
    };

    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      esRef.current?.close();
      esRef.current = null;
      setConnected(false);
      setReconnecting(false);
    };
  }, [enabled, session?.user, qc]);

  return { connected, reconnecting, lastEvent };
}
