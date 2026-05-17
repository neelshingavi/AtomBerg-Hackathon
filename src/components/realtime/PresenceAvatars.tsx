"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useOnlinePresence } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_RING: Record<string, string> = {
  ONLINE: "ring-emerald-500",
  REVIEWING: "ring-violet-500",
  BUSY: "ring-amber-500",
  AWAY: "ring-slate-400",
};

export function PresenceAvatars({ max = 8, className }: { max?: number; className?: string }) {
  const { data: users } = useOnlinePresence();
  const visible = users?.slice(0, max) ?? [];
  const overflow = (users?.length ?? 0) - visible.length;

  if (!visible.length) return null;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <Avatar
            key={u.userId}
            className={cn(
              "h-7 w-7 border-2 border-background ring-2",
              STATUS_RING[u.status] ?? STATUS_RING.ONLINE
            )}
            title={`${u.name}${u.currentView ? ` · ${u.currentView}` : ""}`}
          >
            <AvatarFallback className="text-[9px]">{initials(u.name)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">+{overflow} online</span>
      )}
    </div>
  );
}
