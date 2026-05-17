"use client";

import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  hint,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <FadeIn>
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-gradient-to-b from-muted/40 to-transparent px-8 py-16 text-center shadow-inner",
          className
        )}
        role="status"
      >
        {Icon && (
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-cyan-500/10 ring-1 ring-brand-500/20"
            aria-hidden
          >
            <Icon className="h-8 w-8 text-brand-600" />
          </div>
        )}
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {hint && (
          <p className="mt-3 max-w-sm rounded-lg bg-brand-500/5 px-3 py-2 text-xs text-brand-700">
            {hint}
          </p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </FadeIn>
  );
}
