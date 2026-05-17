"use client";

import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictedBottleneck } from "@/lib/predictive-engine/types";

export function BottleneckPanel({ bottlenecks }: { bottlenecks: PredictedBottleneck[] }) {
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-amber-500" />
          Predicted Bottlenecks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
        {bottlenecks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No significant bottlenecks forecast.</p>
        ) : (
          bottlenecks.slice(0, 6).map((bn) => (
            <div key={bn.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{bn.title}</p>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {bn.probability}%
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{bn.description}</p>
              {bn.daysUntilImpact != null && (
                <p className="mt-1 text-[10px] text-amber-600">~{bn.daysUntilImpact}d to impact</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
