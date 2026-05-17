"use client";

import { Target } from "lucide-react";
import { PRODUCT } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ProductMissionBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-brand-200/50 bg-gradient-to-r from-brand-50/80 to-cyan-50/40 px-4 py-3",
        className
      )}
    >
      <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-800/80">
          {PRODUCT.category}
        </p>
        <p className="text-sm font-medium leading-snug text-foreground">
          {PRODUCT.mission}
        </p>
      </div>
    </div>
  );
}
