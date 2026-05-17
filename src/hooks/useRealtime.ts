"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { RealtimeSnapshot } from "@/lib/realtime/snapshot";

const POLL_MS = 8_000;

export function useRealtimePoll(enabled = true) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const prev = useRef<RealtimeSnapshot | null>(null);

  const query = useQuery({
    queryKey: ["realtime"],
    queryFn: async () => {
      const res = await fetch("/api/realtime");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as RealtimeSnapshot;
    },
    enabled: enabled && !!session?.user,
    refetchInterval: POLL_MS,
    staleTime: POLL_MS / 2,
  });

  useEffect(() => {
    if (!query.data) return;
    const snap = query.data;
    const prior = prev.current;

    if (prior && prior.version !== snap.version) {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["activity-feed"] });
      void qc.invalidateQueries({ queryKey: ["activity-center"] });
      void qc.invalidateQueries({ queryKey: ["goal-sheets"] });
      void qc.invalidateQueries({ queryKey: ["pending-approvals-count"] });
      void qc.invalidateQueries({ queryKey: ["operations"] });
      void qc.invalidateQueries({ queryKey: ["operations-feed"] });
      void qc.invalidateQueries({ queryKey: ["live-activity-stream"] });
      void qc.invalidateQueries({ queryKey: ["command-center-live"] });
      void qc.invalidateQueries({ queryKey: ["operational-alerts"] });
      void qc.invalidateQueries({ queryKey: ["collaboration-spaces"] });
      void qc.invalidateQueries({ queryKey: ["intelligence"] });

      if (snap.lastEvent?.includes("notification") && snap.unreadNotifications > (prior.unreadNotifications ?? 0)) {
        toast.info("New notification", { description: snap.lastEvent });
      }
      if (
        session?.user.role === "MANAGER" &&
        snap.pendingApprovals > (prior.pendingApprovals ?? 0)
      ) {
        toast.info("New approval in queue", {
          description: `${snap.pendingApprovals} pending`,
        });
      }
      if (
        session?.user.role === "ADMIN" &&
        snap.activeEscalations > (prior.activeEscalations ?? 0)
      ) {
        toast.warning("Escalation activity", {
          description: `${snap.activeEscalations} active`,
        });
      }
    }

    prev.current = snap;
  }, [query.data, qc, session?.user.role]);

  return query;
}
