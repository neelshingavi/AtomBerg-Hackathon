"use client";

import {
  Target,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  UserX,
  Lock,
  Share2,
  UserCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { MotionCard } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { ExecutiveKpi } from "@/lib/reports/executive";

const ICONS: Record<string, React.ElementType> = {
  orgGoalCompletion: Target,
  checkinCompliance: ClipboardCheck,
  delayedApprovals: Clock,
  activeEscalations: AlertTriangle,
  atRiskEmployees: UserX,
  lockedGoalSheets: Lock,
  sharedGoalAdoption: Share2,
  managerReviewCompletion: UserCheck,
};

const SEVERITY_BORDER = {
  healthy: "border-emerald-200/60",
  warning: "border-amber-200/60",
  critical: "border-red-200/60",
};

export function ExecutiveKpiRow({ kpis }: { kpis: ExecutiveKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: ExecutiveKpi }) {
  const Icon = ICONS[kpi.key] ?? Target;
  const trendUp = kpi.trendPct >= 0;
  const invertTrend = ["delayedApprovals", "activeEscalations", "atRiskEmployees"].includes(
    kpi.key
  );
  const trendGood = invertTrend ? !trendUp : trendUp;
  const sparkData = kpi.sparkline.map((v, i) => ({ i, v }));

  return (
    <MotionCard
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 shadow-card",
        SEVERITY_BORDER[kpi.severity]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kpi.label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {kpi.value}
            {kpi.unit === "%" && <span className="text-lg text-muted-foreground">%</span>}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {trendGood ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={trendGood ? "text-emerald-600" : "text-red-500"}>
              {kpi.trendPct >= 0 ? "+" : ""}
              {kpi.trendPct}%
            </span>
            <span className="text-muted-foreground">vs prev ({kpi.previousValue}{kpi.unit === "%" ? "%" : ""})</span>
          </div>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            kpi.severity === "critical"
              ? "bg-red-500/10 text-red-600"
              : kpi.severity === "warning"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-brand-500/10 text-brand-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 h-10 w-full opacity-70">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={
                kpi.severity === "critical"
                  ? "#ef4444"
                  : kpi.severity === "warning"
                    ? "#f59e0b"
                    : "#4f6ef7"
              }
              fill={
                kpi.severity === "critical"
                  ? "#ef444433"
                  : kpi.severity === "warning"
                    ? "#f59e0b33"
                    : "#4f6ef733"
              }
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MotionCard>
  );
}
