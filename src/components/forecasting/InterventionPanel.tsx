"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InterventionRecommendation } from "@/lib/predictive-engine/types";

export function InterventionPanel({
  interventions,
}: {
  interventions: InterventionRecommendation[];
}) {
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Recommended Interventions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {interventions.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-l-4 border-l-brand-500 bg-muted/30 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {item.priority}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            <p className="mt-1 text-[10px] text-emerald-600">{item.expectedImpact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
