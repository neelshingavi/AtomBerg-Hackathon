"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { chartTooltipStyle, gradientDefs } from "@/components/analytics/chart-theme";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";

export function TimelineForecastReplay({
  timeline,
}: {
  timeline: PredictiveSnapshot["timelineReplay"];
}) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(timeline.length - 1);

  const data = timeline.map((t) => ({
    label: t.label,
    health: t.healthScore,
    risk: t.riskScore,
    predicted: t.predicted,
  }));

  return (
    <Card className="enterprise-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Timeline Forecast Replay</CardTitle>
          <p className="text-xs text-muted-foreground">
            Historical evolution + projected trajectory
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ left: -16, right: 8 }}>
            {gradientDefs}
            <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="health"
              stroke="#10b981"
              fill="url(#successGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#ef4444"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
        <input
          type="range"
          min={0}
          max={timeline.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          className="mt-3 w-full accent-brand-500"
        />
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {timeline[index]?.label} — Health {timeline[index]?.healthScore}
          {timeline[index]?.predicted && " (projected)"}
        </p>
      </CardContent>
    </Card>
  );
}
