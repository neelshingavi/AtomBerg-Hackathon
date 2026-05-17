"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import type { DepartmentStoryboard } from "@/lib/boardroom/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DepartmentStoryboardsGrid({
  storyboards,
}: {
  storyboards: DepartmentStoryboard[];
}) {
  return (
    <section id="briefing-alignment" className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Department Performance Storyboards</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {storyboards.map((d, i) => (
          <motion.article
            key={d.departmentId}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-semibold text-white">{d.department}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] capitalize",
                  d.healthStatus === "critical" && "border-red-500/50 text-red-300",
                  d.healthStatus === "healthy" && "border-emerald-500/50 text-emerald-300"
                )}
              >
                {d.healthStatus}
              </Badge>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Completion" value={`${d.completionPct}%`} />
              <Stat label="Alignment" value={`${d.alignmentScore}%`} />
              <Stat label="Manager eff." value={`${d.managerEffectiveness}%`} />
              <Stat label="Escalations" value={d.escalationTrend} />
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{d.aiSummary}</p>
            <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200/90">
              {d.whyItMatters}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5">
      <p className="text-slate-500">{label}</p>
      <p className="font-medium tabular-nums text-slate-200">{value}</p>
    </div>
  );
}
