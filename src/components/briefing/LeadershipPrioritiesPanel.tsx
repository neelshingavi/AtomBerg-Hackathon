"use client";

import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import type { LeadershipPriority } from "@/lib/boardroom/types";
import { Badge } from "@/components/ui/badge";

export function LeadershipPrioritiesPanel({
  priorities,
}: {
  priorities: LeadershipPriority[];
}) {
  return (
    <section id="briefing-priorities" className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-red-400" />
        <h2 className="text-lg font-semibold text-white">Top Leadership Priorities</h2>
      </div>
      <div className="space-y-2">
        {priorities.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/80 text-sm font-bold text-white">
              {p.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-white">{p.title}</p>
                <Badge variant="outline" className="text-[10px] capitalize border-white/20">
                  {p.urgency}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">{p.description}</p>
              {p.departments.length > 0 && (
                <p className="mt-1 text-[10px] text-slate-500">{p.departments.join(" · ")}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-slate-500">{p.confidence}%</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
