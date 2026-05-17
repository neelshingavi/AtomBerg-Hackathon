"use client";

import { useSession } from "next-auth/react";
import { useOrganizationPulse } from "@/hooks/useIntelligence";
import { Radio } from "lucide-react";

const FALLBACK = [
  "Organizational pulse stable — alignment within target band",
  "3 initiatives require executive attention this week",
  "Predictive model: Q4 delivery risk elevated in Engineering",
];

export function ExecutiveLiveTicker() {
  const { data: session } = useSession();
  const { data } = useOrganizationPulse();

  if (session?.user?.role !== "ADMIN") return null;

  const items = data
    ? [
        data.narrative,
        ...data.factors.slice(0, 2).map((f) => `${f.label}: ${f.score}% (${f.trend})`),
        ...data.departments
          .filter((d) => d.state === "at_risk" || d.state === "critical")
          .slice(0, 2)
          .map((d) => `${d.name} — ${d.narrative}`),
      ].filter(Boolean)
    : FALLBACK;
  const line = [...items, ...items].join("   ·   ");

  return (
    <div
      className="relative overflow-hidden border-b border-brand-500/15 bg-gradient-to-r from-brand-950/5 via-transparent to-cyan-500/5 py-1.5"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[100vw] items-center gap-2 px-4">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
          <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
          Live
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="animate-marquee whitespace-nowrap text-xs text-muted-foreground">
            {line}
          </p>
        </div>
      </div>
    </div>
  );
}
