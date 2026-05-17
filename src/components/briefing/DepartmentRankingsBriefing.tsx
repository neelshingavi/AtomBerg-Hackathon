"use client";

import { Trophy } from "lucide-react";
import type { DepartmentHealthRow } from "@/lib/reports/executive";

export function DepartmentRankingsBriefing({ rows }: { rows: DepartmentHealthRow[] }) {
  const ranked = [...rows].sort((a, b) => b.completionPct - a.completionPct).slice(0, 8);
  if (!ranked.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Department Rankings</h2>
      </div>
      <ol className="space-y-2">
        {ranked.map((d, i) => (
          <li
            key={d.departmentId}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2"
          >
            <span className="w-6 text-center text-sm font-bold text-brand-400">{i + 1}</span>
            <span className="flex-1 text-sm font-medium text-white">{d.department}</span>
            <span className="text-sm tabular-nums text-emerald-400">{d.completionPct}%</span>
            <span className="text-xs capitalize text-slate-500">{d.healthStatus}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
