"use client";

import { useQuery } from "@tanstack/react-query";
import { AtRiskPanel } from "./AtRiskPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskEntity } from "@/lib/risk/types";

export function AtRiskPanelLoader({
  managerScoped = false,
  compact = true,
  viewAllHref,
}: {
  managerScoped?: boolean;
  compact?: boolean;
  viewAllHref?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["risk", managerScoped],
    queryFn: async () => {
      const res = await fetch("/api/reports/risk");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.employees as RiskEntity[];
    },
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <AtRiskPanel
      employees={data ?? []}
      compact={compact}
      viewAllHref={viewAllHref}
      title={managerScoped ? "Team at-risk" : "At-risk employees"}
    />
  );
}
