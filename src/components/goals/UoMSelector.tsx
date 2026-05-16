"use client";

import type { UoMType } from "@prisma/client";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: UoMType; label: string; description: string }> = [
  {
    value: "NUMERIC_MIN",
    label: "Numeric — higher is better",
    description: "e.g. Revenue, units sold",
  },
  {
    value: "NUMERIC_MAX",
    label: "Numeric — lower is better",
    description: "e.g. TAT, cost, errors",
  },
  {
    value: "PERCENTAGE_MIN",
    label: "Percentage — higher is better",
    description: "e.g. CSAT, completion rate",
  },
  {
    value: "PERCENTAGE_MAX",
    label: "Percentage — lower is better",
    description: "e.g. defect rate",
  },
  {
    value: "TIMELINE",
    label: "Timeline",
    description: "Date-based completion",
  },
  {
    value: "ZERO_BASED",
    label: "Zero-based",
    description: "Zero = success (e.g. incidents)",
  },
];

export function UoMSelector({
  value,
  onChange,
  disabled,
}: {
  value: UoMType;
  onChange: (v: UoMType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
            value === opt.value ? "border-brand-500 bg-brand-50/50" : "border-border hover:bg-muted/50",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <input
            type="radio"
            name="uomType"
            className="mt-1"
            checked={value === opt.value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
          />
          <span>
            <span className="text-sm font-medium block">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
