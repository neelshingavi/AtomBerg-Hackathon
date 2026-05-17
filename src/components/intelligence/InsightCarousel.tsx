"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntelligenceInsights } from "@/hooks/useIntelligence";
import { cn } from "@/lib/utils";
import type { IntelligenceInsight } from "@/lib/intelligence/types";

const PRIORITY_STYLES = {
  critical: "border-red-200 bg-red-50/80",
  warning: "border-amber-200 bg-amber-50/80",
  positive: "border-emerald-200 bg-emerald-50/80",
  informational: "border-border bg-muted/30",
};

export function InsightCarousel() {
  const { data: insights, isLoading } = useIntelligenceInsights();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!insights?.length) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % insights.length);
    }, 6000);
    return () => clearInterval(id);
  }, [insights?.length]);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!insights?.length) return null;

  const current = insights[index];

  return (
    <Card className="border-brand-200/40 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <CardTitle className="text-base">Live executive insights</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Previous insight"
            onClick={() => setIndex((i) => (i - 1 + insights.length) % insights.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {index + 1}/{insights.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Next insight"
            onClick={() => setIndex((i) => (i + 1) % insights.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3 }}
            className={cn("rounded-xl border p-4", PRIORITY_STYLES[current.priority])}
          >
            <InsightCard insight={current} />
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: IntelligenceInsight }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px] capitalize">
          {insight.priority}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {insight.confidence}% confidence
        </Badge>
        {insight.trendPct != null && (
          <span className="text-xs text-muted-foreground">
            {insight.trendPct > 0 ? "+" : ""}
            {insight.trendPct}% trend
          </span>
        )}
      </div>
      <h4 className="font-semibold">{insight.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
      {insight.recommendation && (
        <p className="mt-2 text-xs font-medium text-brand-700">→ {insight.recommendation}</p>
      )}
    </div>
  );
}
