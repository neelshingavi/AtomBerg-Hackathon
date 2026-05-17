"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HealthState } from "@/lib/intelligence/types";

const STATE_COLORS: Record<HealthState, string> = {
  excellent: "#10b981",
  healthy: "#22c55e",
  watchlist: "#f59e0b",
  at_risk: "#f97316",
  critical: "#ef4444",
};

export function HealthGauge({
  score,
  state,
  size = 160,
  label,
}: {
  score: number;
  state: HealthState;
  size?: number;
  label?: string;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = STATE_COLORS[state];

  return (
    <motion.div
      className="relative inline-flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function PulseIndicator({ active }: { active?: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground"
        )}
      />
    </span>
  );
}
