"use client";

import { PageTransition } from "@/components/motion";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageTransition>
      <div
        className={cn(
          "relative mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8",
          className
        )}
      >
        <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" aria-hidden />
        <div className="relative">{children}</div>
      </div>
    </PageTransition>
  );
}
