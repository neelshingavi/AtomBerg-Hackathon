import { cn } from "@/lib/utils";

/** Enterprise typography scale — data-centric, executive tone */
export const typography = {
  hero: "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
  section: "text-lg font-semibold tracking-tight text-foreground",
  dashboard: "text-base font-semibold tracking-tight text-foreground",
  card: "text-sm font-semibold text-foreground",
  body: "text-sm text-foreground leading-relaxed",
  caption: "text-xs text-muted-foreground",
  label: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
} as const;

export function textClass(variant: keyof typeof typography, className?: string) {
  return cn(typography[variant], className);
}

/** Semantic status colors for chips, indicators, borders */
export const statusColors = {
  success: "text-success bg-success/10 border-success/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  danger: "text-destructive bg-destructive/10 border-destructive/20",
  info: "text-info bg-info/10 border-info/20",
  neutral: "text-muted-foreground bg-muted border-border",
  low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  critical: "text-red-700 bg-red-50 border-red-200",
} as const;

export const elevation = {
  sm: "shadow-elevation-sm",
  md: "shadow-elevation-md",
  lg: "shadow-elevation-lg",
  card: "shadow-card",
  "card-hover": "shadow-card-hover",
} as const;
