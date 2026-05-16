"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "./RiskBadge";
import type { RiskEntity } from "@/lib/risk/types";

export function AtRiskPanel({
  employees,
  title = "At-risk employees",
  viewAllHref,
  compact = false,
}: {
  employees: RiskEntity[];
  title?: string;
  viewAllHref?: string;
  compact?: boolean;
}) {
  const list = employees.slice(0, compact ? 5 : 10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {list.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No at-risk employees detected
          </p>
        ) : (
          list.map((emp) => (
            <div
              key={emp.id}
              className="flex items-start justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{emp.name}</p>
                  <RiskBadge level={emp.level} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {emp.department}
                  {emp.managerName ? ` · ${emp.managerName}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {emp.factors[0]?.label}
                  {emp.daysOverdue != null && ` · ${emp.daysOverdue}d overdue`}
                </p>
                {emp.escalationCount != null && emp.escalationCount > 0 && (
                  <p className="text-[10px] text-amber-600">
                    {emp.escalationCount} escalation(s)
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-red-600">{emp.score}</p>
                <p className="text-[10px] text-muted-foreground">risk</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
