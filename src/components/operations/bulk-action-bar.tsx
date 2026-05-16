"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BulkActionBar({
  count,
  children,
  className,
}: {
  count: number;
  children: React.ReactNode;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2",
        className
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-muted-foreground">{count} selected</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function BulkActionButton({
  children,
  variant = "outline",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" variant={variant} className="h-8" {...props}>
      {children}
    </Button>
  );
}
