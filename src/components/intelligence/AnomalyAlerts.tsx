"use client";

import { AlertTriangle } from "lucide-react";
import { useAnomalies } from "@/hooks/useIntelligence";

export function AnomalyAlerts() {
  const { data: anomalies } = useAnomalies();
  const critical = anomalies?.filter((a) => a.severity === "critical") ?? [];
  if (!critical.length) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200/80 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-red-900">Anomaly detection alert</p>
          {critical.slice(0, 2).map((a) => (
            <p key={a.id} className="text-xs text-red-800/90">
              {a.title}: {a.description}
              <span className="ml-1 text-muted-foreground">({a.confidence}% confidence)</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
