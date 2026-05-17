"use client";

import { Users } from "lucide-react";
import type { ManagerEffectivenessRow } from "@/lib/boardroom/types";
import { cn } from "@/lib/utils";

export function ManagerEffectivenessBriefing({ managers }: { managers: ManagerEffectivenessRow[] }) {
  return (
    <section id="briefing-managers" className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Manager Effectiveness Intelligence</h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/80 text-left text-xs text-slate-500">
              <th className="p-3 font-medium">Leader</th>
              <th className="p-3">Responsiveness</th>
              <th className="p-3">Approvals</th>
              <th className="p-3">Escalations</th>
              <th className="p-3">Participation</th>
              <th className="p-3">Overall</th>
              <th className="p-3">Trend</th>
            </tr>
          </thead>
          <tbody>
            {managers.slice(0, 10).map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <p className="font-medium text-white">{m.name}</p>
                  <p className="text-[10px] text-slate-500">{m.department}</p>
                </td>
                <td className="p-3 tabular-nums text-slate-300">{m.responsiveness}</td>
                <td className="p-3 tabular-nums text-slate-300">{m.approvalSpeed}</td>
                <td className="p-3 tabular-nums text-slate-300">{m.escalationHandling}</td>
                <td className="p-3 tabular-nums text-slate-300">{m.teamParticipation}</td>
                <td className="p-3 font-semibold tabular-nums text-brand-300">{m.overallScore}</td>
                <td className="p-3">
                  <span
                    className={cn(
                      "text-xs capitalize",
                      m.trend === "strong" && "text-emerald-400",
                      m.trend === "declining" && "text-red-400",
                      m.trend === "stable" && "text-slate-400"
                    )}
                  >
                    {m.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {managers[0] && (
        <p className="text-sm italic text-slate-400">{managers[0].narrative}</p>
      )}
    </section>
  );
}
