"use client";

import Link from "next/link";
import { Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadershipRecommendations } from "@/hooks/useIntelligence";
import { cn } from "@/lib/utils";

const URGENCY_COLORS = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

export function LeadershipRecommendations({ compact }: { compact?: boolean }) {
  const { data: recs, isLoading } = useLeadershipRecommendations();

  if (isLoading) return <Skeleton className={compact ? "h-32" : "h-48"} />;
  if (!recs?.length) return null;

  const shown = compact ? recs.slice(0, 3) : recs;

  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-brand-600" />
          Leadership recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shown.map((rec) => (
          <div
            key={rec.id}
            className="rounded-lg border border-border/80 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <Badge className={cn("text-[10px]", URGENCY_COLORS[rec.urgency])}>
                    {rec.urgency}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {rec.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{rec.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rec.description}</p>
                {rec.factors.length > 0 && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Factors: {rec.factors.slice(0, 2).join(" · ")}
                  </p>
                )}
              </div>
              {rec.href && (
                <Link
                  href={rec.href}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                >
                  {rec.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
