"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepartmentHealthRow } from "@/lib/reports/executive";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DepartmentHealthRow["healthStatus"], string> = {
  healthy: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/25 text-amber-900 dark:text-amber-200 border-amber-500/30",
  critical: "bg-red-500/30 text-red-900 dark:text-red-200 border-red-500/35",
};

const METRICS: Array<{
  key: keyof Pick<
    DepartmentHealthRow,
    "completionPct" | "riskScore" | "delayedCheckins" | "escalationCount" | "managerResponsiveness"
  >;
  label: string;
  format: (row: DepartmentHealthRow) => string;
}> = [
  { key: "completionPct", label: "Completion", format: (r) => `${r.completionPct}%` },
  { key: "riskScore", label: "Risk", format: (r) => String(r.riskScore) },
  { key: "delayedCheckins", label: "Late CI", format: (r) => String(r.delayedCheckins) },
  { key: "escalationCount", label: "Escal.", format: (r) => String(r.escalationCount) },
  {
    key: "managerResponsiveness",
    label: "Mgr SLA",
    format: (r) => `${r.managerResponsiveness}%`,
  },
];

function cellSeverity(
  key: (typeof METRICS)[number]["key"],
  row: DepartmentHealthRow
): DepartmentHealthRow["healthStatus"] {
  if (key === "completionPct") {
    if (row.completionPct >= 75) return "healthy";
    if (row.completionPct >= 50) return "warning";
    return "critical";
  }
  if (key === "riskScore") {
    if (row.riskScore < 40) return "healthy";
    if (row.riskScore < 65) return "warning";
    return "critical";
  }
  return row.healthStatus;
}

export function DepartmentHealthHeatmap({ rows }: { rows: DepartmentHealthRow[] }) {
  if (!rows.length) {
    return (
      <Card className="enterprise-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Department Health Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No department data for this cycle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enterprise-card overflow-x-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Department Health Heatmap</CardTitle>
        <p className="text-xs text-muted-foreground">
          Completion, risk, check-ins, escalations, and manager responsiveness
        </p>
      </CardHeader>
      <CardContent>
        <table className="w-full min-w-[520px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-muted-foreground">Department</th>
              {METRICS.map((m) => (
                <th key={m.key} className="p-2 text-center font-medium text-muted-foreground">
                  {m.label}
                </th>
              ))}
              <th className="p-2 text-center font-medium text-muted-foreground">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.departmentId} className="border-t border-border/50">
                <td className="p-2 font-medium">{row.department}</td>
                {METRICS.map((m) => {
                  const severity = cellSeverity(m.key, row);
                  return (
                    <td key={m.key} className="p-1">
                      <div
                        className={cn(
                          "rounded-md border px-2 py-2 text-center font-medium transition-transform hover:scale-[1.02]",
                          STATUS_STYLES[severity]
                        )}
                        title={`${row.department} — ${m.label}`}
                      >
                        {m.format(row)}
                      </div>
                    </td>
                  );
                })}
                <td className="p-1 text-center">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-1 font-medium",
                      row.trendPct >= 0
                        ? "text-emerald-700 bg-emerald-500/15"
                        : "text-red-700 bg-red-500/15"
                    )}
                  >
                    {row.trendPct > 0 ? "+" : ""}
                    {row.trendPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
