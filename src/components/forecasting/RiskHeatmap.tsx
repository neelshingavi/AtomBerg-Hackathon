"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeatmapCell } from "@/lib/predictive-engine/types";
import { cn } from "@/lib/utils";

const SEVERITY_BG: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
  medium: "bg-amber-500/25 text-amber-900 dark:text-amber-200",
  high: "bg-orange-500/30 text-orange-900 dark:text-orange-200",
  critical: "bg-red-500/35 text-red-900 dark:text-red-200",
};

export function RiskHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const rows = Array.from(new Set(cells.map((c) => c.row)));
  const cols = Array.from(new Set(cells.map((c) => c.col)));

  return (
    <Card className="enterprise-card overflow-x-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Enterprise Risk Heatmap</CardTitle>
        <p className="text-xs text-muted-foreground">
          Predictive severity by department and risk dimension
        </p>
      </CardHeader>
      <CardContent>
        <table className="w-full min-w-[400px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-muted-foreground" />
              {cols.map((col) => (
                <th key={col} className="p-2 text-center font-medium text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="p-2 font-medium">{row}</td>
                {cols.map((col) => {
                  const cell = cells.find((c) => c.row === row && c.col === col);
                  if (!cell) return <td key={col} className="p-1" />;
                  return (
                    <td key={col} className="p-1">
                      <div
                        className={cn(
                          "rounded-md px-2 py-2 text-center font-medium transition-transform hover:scale-105",
                          SEVERITY_BG[cell.severity]
                        )}
                        title={cell.label}
                      >
                        {Math.round(cell.value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
