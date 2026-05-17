"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingShell({ title = true }: { title?: boolean }) {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy aria-label="Loading page">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 skeleton-shimmer" />
          <Skeleton className="h-4 w-96 max-w-full skeleton-shimmer" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl skeleton-shimmer" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl skeleton-shimmer" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl skeleton-shimmer" />
        <Skeleton className="h-48 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}
