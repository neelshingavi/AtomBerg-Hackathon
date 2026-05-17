"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InitiativeForecast } from "@/lib/predictive-engine/types";

export function InitiativeForecastPanel({
  initiatives,
}: {
  initiatives: InitiativeForecast[];
}) {
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Strategic Initiative Forecasting</CardTitle>
        <p className="text-xs text-muted-foreground">Success probability & risk contributors</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {initiatives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active shared goals to forecast.</p>
        ) : (
          initiatives.map((init) => (
            <div key={init.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{init.title}</p>
                <Badge
                  variant={init.successProbability >= 60 ? "secondary" : "destructive"}
                  className="shrink-0 tabular-nums"
                >
                  {init.successProbability}%
                </Badge>
              </div>
              {init.thrustArea && (
                <p className="mt-1 text-[10px] text-muted-foreground">{init.thrustArea}</p>
              )}
              {init.riskContributors.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {init.riskContributors.map((r, i) => (
                    <li key={i} className="text-[10px] text-amber-700 dark:text-amber-400">
                      · {r}
                    </li>
                  ))}
                </ul>
              )}
              {init.projectedDelayDays != null && (
                <p className="mt-1 text-[10px] text-red-600">
                  Projected delay: ~{init.projectedDelayDays} days
                </p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">
                {init.confidence}% confidence
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
