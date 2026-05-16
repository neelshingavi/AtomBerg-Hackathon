"use client";

import { differenceInDays, format } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DeadlineChip({
  deadline,
  label = "Due",
  className,
}: {
  deadline: Date | string;
  label?: string;
  className?: string;
}) {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const days = differenceInDays(d, new Date());
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 3;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        overdue && "border-destructive/50 bg-destructive/10 text-destructive",
        urgent && !overdue && "border-warning/50 bg-warning/10 text-warning",
        className
      )}
    >
      {overdue ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {label}{" "}
      {overdue
        ? `${Math.abs(days)}d overdue`
        : days === 0
          ? "today"
          : `${days}d left`}{" "}
      · {format(d, "MMM d")}
    </Badge>
  );
}
