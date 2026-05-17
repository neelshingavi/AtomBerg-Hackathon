"use client";

import { Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthGauge } from "./HealthGauge";
import { LeadershipRecommendations } from "./LeadershipRecommendations";
import {
  useOrganizationPulse,
  useAnomalies,
  useWhatChanged,
} from "@/hooks/useIntelligence";

export function ExecutiveAiSidebar() {
  const { data: pulse, isLoading } = useOrganizationPulse();
  const { data: anomalies } = useAnomalies();
  const { data: changes } = useWhatChanged();

  if (isLoading) return <Skeleton className="h-[480px] w-full" />;

  return (
    <aside className="space-y-4" aria-label="Executive intelligence sidebar">
      <Card className="enterprise-card overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-br from-brand-500/10 to-transparent">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-brand-600" />
            Organization pulse
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-2">
          {pulse && (
            <>
              <HealthGauge score={pulse.overallScore} state={pulse.state} size={120} />
              <p className="mt-2 text-center text-xs text-muted-foreground line-clamp-3">
                {pulse.narrative}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {changes && (
        <Card className="enterprise-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              What changed · {changes.periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs font-medium">{changes.executiveSummary}</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {changes.items.slice(0, 3).map((item, i) => (
                <li key={i} className="border-l-2 border-brand-300 pl-2">
                  {item.interpretation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {anomalies && anomalies.length > 0 && (
        <Card className="border-amber-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Anomalies ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {anomalies.slice(0, 2).map((a) => (
              <p key={a.id} className="text-xs text-amber-900/90">
                <span className="font-medium">{a.title}</span> — {a.description}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <LeadershipRecommendations compact />
    </aside>
  );
}
