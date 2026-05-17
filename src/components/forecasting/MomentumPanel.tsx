"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MomentumScore } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

export function MomentumPanel({ momentum }: { momentum: MomentumScore }) {
  const TrendIcon =
    momentum.trend === "accelerating"
      ? TrendingUp
      : momentum.trend === "decelerating"
        ? TrendingDown
        : Minus;

  return (
    <Card className="enterprise-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Organizational Momentum</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-end gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold tabular-nums text-brand-600"
          >
            {momentum.overall}
          </motion.div>
          <div className="mb-1 flex items-center gap-1.5 text-sm">
            <TrendIcon
              className={cn(
                "h-4 w-4",
                momentum.trend === "accelerating" && "text-emerald-500",
                momentum.trend === "decelerating" && "text-red-500",
                momentum.trend === "stable" && "text-slate-400"
              )}
            />
            <span className="capitalize text-muted-foreground">{momentum.trend}</span>
            <span className="text-xs text-muted-foreground">
              ({momentum.acceleration > 0 ? "+" : ""}
              {momentum.acceleration})
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {momentum.departments.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs">
              <span className="truncate text-muted-foreground">{d.name}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums font-medium">{d.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
