"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskRadarItem } from "@/lib/predictive-engine/types";

export function RiskRadarChart({ items }: { items: RiskRadarItem[] }) {
  const data = items.map((item) => ({
    subject: item.label,
    probability: item.probability,
    fullMark: 100,
  }));

  return (
    <Card className="enterprise-card overflow-hidden border-violet-500/20 bg-gradient-to-br from-slate-950/5 to-violet-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Executive Risk Radar
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Emerging risks · probability-weighted
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
            <Radar
              name="Probability"
              dataKey="probability"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                fontSize: "12px",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
