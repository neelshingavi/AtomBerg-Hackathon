"use client";

import { useRealtimePoll } from "@/hooks/useRealtime";

/** Mount once in app shell to enable live polling + cache invalidation. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimePoll(true);
  return <>{children}</>;
}
