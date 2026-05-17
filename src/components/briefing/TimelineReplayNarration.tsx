"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chartTooltipStyle, gradientDefs } from "@/components/analytics/chart-theme";
import type { BoardroomSnapshot } from "@/lib/boardroom/types";

export function TimelineReplayNarration({
  timeline,
  narrative,
}: {
  timeline: BoardroomSnapshot["timelineReplay"];
  narrative?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(timeline.length - 1);

  const data = timeline.map((t) => ({
    label: t.label,
    health: t.health,
    escalations: t.escalations,
    predicted: t.predicted,
  }));

  useEffect(() => {
    if (!playing || timeline.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= timeline.length - 1 ? 0 : i + 1));
    }, 1400);
    return () => clearInterval(id);
  }, [playing, timeline.length]);

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Executive Timeline Replay</h2>
          <p className="text-xs text-slate-500">Organizational evolution with AI narration</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-slate-300"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      {narrative && (
        <p className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
          {narrative}
        </p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          {gradientDefs}
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <Tooltip {...chartTooltipStyle} />
          <Area
            type="monotone"
            dataKey="health"
            stroke="#10b981"
            fill="url(#successGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <input
        type="range"
        min={0}
        max={Math.max(0, timeline.length - 1)}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
      <p className="text-center text-xs text-slate-400">
        {timeline[index]?.label} — Health {timeline[index]?.health}
        {timeline[index]?.predicted && " (forecast)"}
      </p>
    </section>
  );
}
