"use client";

import { Rocket } from "lucide-react";
import type { InitiativeTrackItem } from "@/lib/boardroom/types";

export function InitiativeTrackingCenter({ initiatives }: { initiatives: InitiativeTrackItem[] }) {
  return (
    <section id="briefing-initiatives" className="space-y-4">
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Strategic Initiative Tracking</h2>
      </div>
      {initiatives.length === 0 ? (
        <p className="text-sm text-slate-500">No shared strategic initiatives in active cycle.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {initiatives.map((init) => (
            <article
              key={init.id}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
            >
              <header className="flex justify-between gap-2">
                <p className="font-medium text-white">{init.title}</p>
                <span className="shrink-0 text-lg font-bold tabular-nums text-emerald-400">
                  {init.successProbability}%
                </span>
              </header>
              <p className="text-xs text-slate-500">
                {init.owner} · {init.momentum}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-brand-500 transition-all duration-700"
                  style={{ width: `${init.successProbability}%` }}
                />
              </div>
              {init.blockers.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {init.blockers.map((b, i) => (
                    <li key={i} className="text-[10px] text-amber-400/90">
                      · {b}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-slate-500">
                Timeline confidence {init.timelineConfidence}%
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
