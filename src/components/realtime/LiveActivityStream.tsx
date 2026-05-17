"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveActivityStream } from "@/hooks/useLiveActivityStream";
import { LivePulseIndicator } from "./LivePulseIndicator";
import { cn } from "@/lib/utils";
import type { LiveStreamEvent } from "@/lib/realtime/types";

const SEVERITY: Record<string, string> = {
  low: "border-slate-200 bg-slate-50/50",
  medium: "border-amber-200 bg-amber-50/40",
  high: "border-orange-300 bg-orange-50/50",
  critical: "border-red-300 bg-red-50/50 animate-pulse",
};

function initials(name?: string) {
  if (!name) return "SY";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LiveActivityStream({
  limit = 25,
  compact,
}: {
  limit?: number;
  compact?: boolean;
}) {
  const { data: items, isLoading } = useLiveActivityStream(limit);

  return (
    <section className="space-y-3" data-live-activity-stream>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold">Live organizational stream</h3>
        </div>
        <LivePulseIndicator />
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ul className={cn("space-y-2", compact && "max-h-80 overflow-y-auto")}>
          <AnimatePresence initial={false}>
            {items?.map((item) => (
              <StreamRow key={item.id} item={item} />
            ))}
          </AnimatePresence>
          {!items?.length && (
            <li className="text-sm text-muted-foreground">No live activity yet.</li>
          )}
        </ul>
      )}
    </section>
  );
}

function StreamRow({ item }: { item: LiveStreamEvent }) {
  const content = (
    <motion.li
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm",
        SEVERITY[item.severity] ?? SEVERITY.low
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px]">{initials(item.actorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{item.title}</p>
          <Badge variant="outline" className="text-[9px] capitalize">
            {item.eventType.replace(/_/g, " ").toLowerCase()}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {item.actorName ?? "System"} ·{" "}
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
    </motion.li>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
