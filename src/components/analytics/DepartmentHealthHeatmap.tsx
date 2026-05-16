"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentHealthRow } from "@/lib/reports/executive";

const HEALTH_BG = {
  healthy: "bg-emerald-500/90 hover:bg-emerald-500",
  warning: "bg-amber-500/90 hover:bg-amber-500",
  critical: "bg-red-500/90 hover:bg-red-500",
};

export function DepartmentHealthHeatmap({
  rows,
  onSelect,
}: {
  rows: DepartmentHealthRow[];
  onSelect?: (dept: DepartmentHealthRow) => void;
}) {
  const [filter, setFilter] = useState<"all" | "healthy" | "warning" | "critical">("all");
  const filtered =
    filter === "all" ? rows : rows.filter((r) => r.healthStatus === filter);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Department health heatmap</CardTitle>
        <div className="flex gap-1">
          {(["all", "healthy", "warning", "critical"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
                filter === f
                  ? "bg-brand-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((dept) => (
              <Tooltip key={dept.departmentId}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelect?.(dept)}
                    className={cn(
                      "group relative flex min-h-[100px] flex-col justify-between rounded-lg p-3 text-left text-white transition-transform hover:scale-[1.02]",
                      HEALTH_BG[dept.healthStatus]
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
                      {dept.department}
                    </span>
                    <div>
                      <p className="text-2xl font-bold">{dept.completionPct}%</p>
                      <p className="text-[10px] opacity-80">completion</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] opacity-90">
                      <span>Risk {dept.riskScore}</span>
                      <span>·</span>
                      <span>{dept.escalationCount} esc</span>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p className="font-semibold">{dept.department}</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    <li>Completion: {dept.completionPct}%</li>
                    <li>Delayed check-ins: {dept.delayedCheckins}</li>
                    <li>Delayed approvals: {dept.delayedApprovals}</li>
                    <li>Risk score: {dept.riskScore}/100</li>
                    <li>Manager responsiveness: {dept.managerResponsiveness}%</li>
                    <li>Trend: {dept.trendPct >= 0 ? "+" : ""}{dept.trendPct}%</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No departments match this filter
          </p>
        )}
      </CardContent>
    </Card>
  );
}
