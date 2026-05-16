"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterChip = { id: string; label: string; value: string };

export function TableFilterBar({
  children,
  chips = [],
  onRemoveChip,
  onClearAll,
  className,
}: {
  children?: React.ReactNode;
  chips?: FilterChip[];
  onRemoveChip?: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {children ? <div className="flex flex-wrap items-end gap-3">{children}</div> : null}
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Badge key={chip.id} variant="secondary" className="gap-1 pr-1 font-normal">
              <span className="text-muted-foreground">{chip.label}:</span>
              {chip.value}
              {onRemoveChip ? (
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  onClick={() => onRemoveChip(chip.id)}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))}
          {onClearAll && chips.length > 1 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClearAll}>
              Clear all
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
