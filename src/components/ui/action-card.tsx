"use client";

import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { MotionCard } from "@/components/motion";
import { cn } from "@/lib/utils";

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  variant = "default",
  className,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}) {
  const variants = {
    default: "border-border hover:border-brand-200 hover:bg-brand-50/30",
    primary: "border-brand-200 bg-gradient-to-br from-brand-50/80 to-cyan-50/50 hover:shadow-glow",
    success:
      "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 hover:border-emerald-300",
    warning:
      "border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 hover:border-amber-300",
  };

  return (
    <Link href={href} className={cn("block", className)}>
      <MotionCard
        className={cn(
          "shine-border flex items-center justify-between gap-4 rounded-xl border p-5 shadow-card transition-all duration-300",
          variants[variant]
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </MotionCard>
    </Link>
  );
}
