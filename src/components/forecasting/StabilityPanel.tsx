"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StabilityMetrics } from "@/lib/predictive-engine/types";

export function StabilityPanel({ stability }: { stability: StabilityMetrics }) {
  const metrics = [
    { label: "Engagement consistency", value: stability.engagementConsistency },
    { label: "Participation reliability", value: stability.participationReliability },
    { label: "Manager responsiveness", value: stability.managerResponsiveness },
    { label: "Operational resilience", value: stability.operationalResilience },
    { label: "Execution volatility", value: stability.executionVolatility },
  ];

  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Workforce Stability</CardTitle>
        <p className="text-2xl font-bold tabular-nums text-brand-600">{stability.overall}%</p>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">{stability.narrative}</p>
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="font-medium tabular-nums">{m.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
