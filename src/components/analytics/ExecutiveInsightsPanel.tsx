"use client";

import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/motion";
import type { ExecutiveInsight } from "@/lib/intelligence/insights";

const TYPE_STYLES = {
  positive: {
    icon: TrendingUp,
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    iconColor: "text-emerald-600",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    iconColor: "text-amber-600",
  },
  critical: {
    icon: AlertTriangle,
    border: "border-red-200",
    bg: "bg-red-50/50",
    iconColor: "text-red-600",
  },
  neutral: {
    icon: Info,
    border: "border-border",
    bg: "bg-muted/30",
    iconColor: "text-muted-foreground",
  },
};

export function ExecutiveInsightsPanel({ insights }: { insights: ExecutiveInsight[] }) {
  return (
    <Card className="border-brand-200/40 bg-gradient-to-br from-brand-50/30 via-card to-cyan-50/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Executive intelligence</CardTitle>
            <p className="text-xs text-muted-foreground">
              AI-powered organizational insights
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <StaggerGrid className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const style = TYPE_STYLES[insight.type];
            const Icon = style.icon;
            return (
              <StaggerItem key={insight.id}>
                <FadeIn>
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      style.border,
                      style.bg
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} />
                      <div>
                        <p className="text-sm font-semibold">{insight.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {insight.body}
                        </p>
                        {insight.metric && (
                          <p className="mt-2 text-lg font-bold text-foreground">
                            {insight.metric}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
        {insights.length === 0 && (
          <p className="text-sm text-muted-foreground">Generating insights…</p>
        )}
      </CardContent>
    </Card>
  );
}
