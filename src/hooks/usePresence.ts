"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { PresenceUser } from "@/lib/realtime/types";

export function usePresenceHeartbeat(currentView?: string) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const ping = () => {
      void fetch("/api/realtime/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ONLINE", currentView }),
      });
    };

    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, [session?.user, currentView]);
}

export function useOnlinePresence() {
  return useQuery({
    queryKey: ["online-presence"],
    queryFn: async () => {
      const res = await fetch("/api/realtime/presence");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.users as PresenceUser[];
    },
    refetchInterval: 15_000,
  });
}
