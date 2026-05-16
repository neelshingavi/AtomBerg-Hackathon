import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/risk/types";
import type { EscalationSeverity } from "@/lib/risk/escalation-utils";

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel | EscalationSeverity;
  className?: string;
}) {
  const styles: Record<string, string> = {
    healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[level] ?? styles.warning,
        className
      )}
    >
      {level}
    </span>
  );
}
