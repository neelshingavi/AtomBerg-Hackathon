"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveStreamEvent } from "@/lib/realtime/types";

export function OperationalTimeline() {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ["operational-timeline"],
    queryFn: async () => {
      const res = await fetch("/api/realtime/timeline?limit=40");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        items: LiveStreamEvent[];
        annotations: Array<{ id: string; title: string; severity: string; recommendation?: string }>;
      };
    },
    refetchInterval: 15_000,
  });

  const items = data?.items ?? [];
  const current = items[index];

  return (
    <Card data-operational-timeline>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          Enterprise event timeline
        </CardTitle>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {current && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{current.title}</p>
            <p className="text-xs text-muted-foreground">{current.description}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {format(new Date(current.createdAt), "PPp")}
            </p>
          </div>
        )}
        <input
          type="range"
          min={0}
          max={Math.max(0, items.length - 1)}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
          {items.slice(0, 15).map((item, i) => (
            <li
              key={item.id}
              className={i === index ? "font-medium text-brand-600" : "text-muted-foreground"}
            >
              {item.title} · {format(new Date(item.createdAt), "HH:mm")}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
