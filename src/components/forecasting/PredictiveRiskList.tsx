"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictedRisk } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export function PredictiveRiskList({ predictions }: { predictions: PredictedRisk[] }) {
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Execution Forecast Engine</CardTitle>
        <p className="text-xs text-muted-foreground">
          Predicted operational risks with probability & confidence
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
        {predictions.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border p-3 transition-shadow hover:shadow-md"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className={cn("text-[10px]", SEVERITY_COLORS[p.severity])}>
                {p.probability}% · {p.severity}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {p.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm font-medium">{p.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.narrative}</p>
            <p className="mt-2 text-[10px] text-violet-600 dark:text-violet-400">
              Impact: {p.projectedImpact}
            </p>
            {p.affectedDepartments.length > 0 && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Departments: {p.affectedDepartments.join(", ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
