"use client";

import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function OperationalDramaBanner({
  active,
  headline,
  impact,
  action,
  className,
}: {
  active: boolean;
  headline: string;
  impact?: string;
  action?: string;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "overflow-hidden rounded-xl border border-red-300/60 bg-gradient-to-r from-red-950/90 via-red-900/85 to-amber-950/80 px-4 py-3 text-white shadow-lg shadow-red-900/20",
            "ring-1 ring-red-400/30",
            className
          )}
          role="alert"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 animate-pulse" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold leading-snug">{headline}</p>
              {impact && (
                <p className="text-xs text-red-100/90">
                  <span className="font-medium text-white">Business impact: </span>
                  {impact}
                </p>
              )}
              {action && (
                <p className="text-xs font-medium text-amber-200">
                  Recommended intervention → {action}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
