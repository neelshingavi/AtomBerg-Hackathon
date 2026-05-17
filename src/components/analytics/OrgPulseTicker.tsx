"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Target, TrendingUp } from "lucide-react";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";

type TickerItem = { label: string; value: string; icon: React.ElementType };

export function OrgPulseTicker() {
  const { data: cycleData } = useCurrentCycle();
  const cycleId = cycleData?.active?.id;

  const { data } = useQuery({
    queryKey: ["org-pulse", cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const res = await fetch(`/api/reports/executive?cycleId=${cycleId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        kpis: Array<{ key: string; label: string; value: number; unit: string }>;
      };
    },
    refetchInterval: 60_000,
  });

  if (!data?.kpis?.length) return null;

  const items: TickerItem[] = data.kpis.slice(0, 6).map((k) => ({
    label: k.label,
    value: k.unit === "%" ? `${k.value}%` : String(k.value),
    icon:
      k.key.includes("risk") || k.key.includes("Escalation")
        ? AlertTriangle
        : k.key.includes("Completion")
          ? Target
          : k.key.includes("Check")
            ? Activity
            : TrendingUp,
  }));

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-brand-500/20 bg-gradient-to-r from-brand-500/5 via-transparent to-cyan-500/5 py-2"
      aria-label="Organization pulse ticker"
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -50 * items.length] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <div key={`${item.label}-${i}`} className="flex items-center gap-2 px-4 text-sm">
            <item.icon className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
