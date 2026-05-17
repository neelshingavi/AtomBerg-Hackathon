"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartTooltipStyle, gradientDefs } from "@/components/analytics/chart-theme";
import type { TrajectoryForecast } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

export function ForecastTrajectoryChart({
  trajectory,
  className,
}: {
  trajectory: TrajectoryForecast;
  className?: string;
}) {
  const data = trajectory.points.map((p) => ({
    label: p.label,
    actual: p.actual,
    predicted: p.predicted,
    lower: p.lower,
    upper: p.upper,
    isFuture: p.actual == null,
  }));

  return (
    <Card className={cn("enterprise-card overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{trajectory.label}</CardTitle>
          <span
            className={cn(
              "text-xs font-medium capitalize",
              trajectory.direction === "improving" && "text-emerald-600",
              trajectory.direction === "declining" && "text-red-500",
              trajectory.direction === "stable" && "text-slate-500"
            )}
          >
            {trajectory.direction} → {trajectory.projected}
            <span className="ml-1 text-muted-foreground">({trajectory.confidence}% conf.)</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            {gradientDefs}
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, "auto"]} />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#4f6ef7"
              fillOpacity={0.08}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#8b5cf6" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
