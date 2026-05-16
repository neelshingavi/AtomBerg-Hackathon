"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  checked,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<"button">, "checked" | "onChange"> & {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}) {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      className={cn(
        "peer flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        className
      )}
      data-state={isIndeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange?.(!isChecked)}
      {...props}
    >
      {(isChecked || isIndeterminate) && (
        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
      )}
    </button>
  );
}
