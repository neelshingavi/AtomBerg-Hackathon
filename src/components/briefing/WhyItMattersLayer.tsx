"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import type { WhyItMattersItem } from "@/lib/boardroom/types";
import { cn } from "@/lib/utils";

const URGENCY_BORDER: Record<string, string> = {
  low: "border-slate-500/30",
  medium: "border-amber-500/40",
  high: "border-orange-500/50",
  critical: "border-red-500/60",
};

export function WhyItMattersLayer({ items }: { items: WhyItMattersItem[] }) {
  return (
    <section id="briefing-risks" className="space-y-4">
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Why This Matters</h2>
        <span className="text-xs text-slate-500">Business impact layer</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "rounded-xl border bg-slate-900/50 p-4 backdrop-blur-sm",
              URGENCY_BORDER[item.urgency]
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {item.metric}
            </p>
            <p className="mt-1 text-sm text-slate-300">{item.observation}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-amber-100/90">
              {item.businessImpact}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
