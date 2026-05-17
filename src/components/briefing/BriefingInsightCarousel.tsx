"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { IntelligenceInsight } from "@/lib/intelligence/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  critical: "from-red-500/20 to-transparent border-red-500/30",
  warning: "from-amber-500/20 to-transparent border-amber-500/30",
  positive: "from-emerald-500/20 to-transparent border-emerald-500/30",
  informational: "from-slate-500/10 to-transparent border-slate-500/20",
};

export function BriefingInsightCarousel({ insights }: { insights: IntelligenceInsight[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!insights.length) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % insights.length), 7000);
    return () => clearInterval(id);
  }, [insights.length]);

  if (!insights.length) return null;
  const current = insights[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Live executive intelligence
        </span>
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {index + 1} / {insights.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "rounded-lg border bg-gradient-to-br p-4",
            STYLES[current.priority] ?? STYLES.informational
          )}
        >
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/20 text-[10px] capitalize text-slate-300">
              {current.priority}
            </Badge>
            <Badge variant="outline" className="border-white/20 text-[10px] text-slate-400">
              {current.category}
            </Badge>
            <span className="text-[10px] text-slate-500">{current.confidence}% confidence</span>
          </div>
          <h3 className="text-lg font-semibold text-white">{current.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{current.body}</p>
          {current.recommendation && (
            <p className="mt-3 text-xs font-medium text-violet-300">→ {current.recommendation}</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

