"use client";

import { AlertOctagon } from "lucide-react";
import type { CommandCenterLive, OperationalAlertItem } from "@/lib/realtime/types";
import Link from "next/link";

export function IncidentResponsePanel({
  alerts,
  pulse,
}: {
  alerts: OperationalAlertItem[];
  pulse: CommandCenterLive["pulse"];
}) {
  const critical = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH");

  return (
    <section className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-950/40 via-slate-950 to-red-950/20 p-5">
      <div className="flex items-center gap-2 text-red-400">
        <AlertOctagon className="h-5 w-5 animate-pulse" />
        <h2 className="text-lg font-semibold">Incident Response Mode</h2>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        Operational risk elevated — {critical.length} critical alerts · {pulse.escalations} active
        escalations · org health {pulse.overallScore}.
      </p>
      <ul className="mt-4 space-y-2">
        {critical.slice(0, 4).map((a) => (
          <li key={a.id} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm">
            <span className="font-medium text-red-200">{a.title}</span>
            <p className="text-xs text-red-200/70">{a.recommendation ?? a.message}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/escalations"
          className="inline-flex h-8 items-center rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground"
        >
          Escalation center
        </Link>
        <Link
          href="/admin/forecast"
          className="inline-flex h-8 items-center rounded-md border border-white/20 px-3 text-xs text-white hover:bg-white/10"
        >
          Predictive forecast
        </Link>
        <Link
          href="/admin/alignment"
          className="inline-flex h-8 items-center rounded-md border border-white/20 px-3 text-xs text-white hover:bg-white/10"
        >
          Alignment graph
        </Link>
      </div>
    </section>
  );
}
