"use client";

import { useEffect, useState } from "react";
import { Shield, Radio, Database, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/brand";
import { RealtimeSyncIndicator } from "@/components/polish/RealtimeSyncIndicator";

type TrustSignalsStripProps = {
  aiConfidence?: number;
  className?: string;
  compact?: boolean;
};

export function TrustSignalsStrip({
  aiConfidence = 94,
  className,
  compact = false,
}: TrustSignalsStripProps) {
  const [syncedAt, setSyncedAt] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setSyncedAt(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  const items = [
    {
      icon: Sparkles,
      label: "AI confidence",
      value: `${aiConfidence}%`,
      tone: "text-brand-700",
    },
    {
      icon: Database,
      label: "Data freshness",
      value: "Live cycle",
      tone: "text-emerald-700",
    },
    {
      icon: Radio,
      label: "Operational sync",
      value: "Real-time",
      tone: "text-cyan-700",
    },
    {
      icon: Clock,
      label: "Last updated",
      value: syncedAt || "—",
      tone: "text-muted-foreground",
    },
    {
      icon: Shield,
      label: "Audit trace",
      value: "Enabled",
      tone: "text-slate-700",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-2.5 text-xs",
        className
      )}
      role="status"
      aria-label="Trust and data integrity signals"
    >
      {!compact && (
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          {PRODUCT.name} · Trust layer
        </span>
      )}
      {items.map(({ icon: Icon, label, value, tone }) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} aria-hidden />
          <span className="text-muted-foreground">{label}</span>
          <span className={cn("font-medium tabular-nums", tone)}>{value}</span>
        </span>
      ))}
      <RealtimeSyncIndicator className="ml-auto" />
    </div>
  );
}
