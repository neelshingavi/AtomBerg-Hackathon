"use client";

import { AlertTriangle, Bell, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EarlyWarning } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  informational: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50",
  positive: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  critical: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30",
  "high-risk": "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30",
};

export function EarlyWarningPanel({ warnings }: { warnings: EarlyWarning[] }) {
  return (
    <Card className="enterprise-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bell className="h-4 w-4 text-amber-500" />
          Early Warning System
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Proactive alerts before failures occur
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {warnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active warnings — trajectory stable.</p>
        ) : (
          warnings.map((w) => (
            <div
              key={w.id}
              className={cn(
                "flex gap-3 rounded-lg border px-3 py-2.5 transition-all",
                TYPE_STYLES[w.type] ?? TYPE_STYLES.warning
              )}
            >
              {w.type === "critical" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{w.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {w.confidence}% conf.
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{w.message}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
