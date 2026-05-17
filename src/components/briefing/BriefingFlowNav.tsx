"use client";

import { motion } from "framer-motion";
import type { BriefingFlowStep } from "@/lib/boardroom/types";
import { cn } from "@/lib/utils";

export function BriefingFlowNav({
  steps,
  activeStep,
  onStep,
}: {
  steps: BriefingFlowStep[];
  activeStep: string;
  onStep: (id: string) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {steps.map((step, i) => {
        const active = activeStep === step.id;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              onStep(step.id);
              document.querySelector(step.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "relative rounded-lg px-3 py-2 text-left transition-all",
              active
                ? "bg-brand-600/90 text-white shadow-lg shadow-brand-500/25"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {active && (
              <motion.span
                layoutId="briefing-flow-active"
                className="absolute inset-0 rounded-lg bg-brand-600"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="text-xs font-medium">{step.title}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
