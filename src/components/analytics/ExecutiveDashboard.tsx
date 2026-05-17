"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, FadeInView } from "@/components/motion";
import { AnalyticsFilters, type AnalyticsFilterValues } from "./AnalyticsFilters";
import { ExecutiveKpiRow } from "./ExecutiveKpiRow";
import { DepartmentHealthHeatmap } from "./DepartmentHealthHeatmap";
import { AlignmentTree } from "./AlignmentTree";
import { ExecutiveInsightsPanel } from "./ExecutiveInsightsPanel";
import { AtRiskPanel } from "./AtRiskPanel";
import { OperationalCommandCenter } from "./OperationalCommandCenter";
import { EscalationIntelligence } from "./EscalationIntelligence";
import type { ExecutiveReport } from "@/lib/reports/executive";
import { OrgPulseTicker } from "./OrgPulseTicker";

const REFETCH_MS = 45_000;

export function ExecutiveDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilterValues>({ cycleId: "" });

  const handleFilters = useCallback((f: AnalyticsFilterValues) => {
    setFilters(f);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["executive", filters.cycleId, filters.departmentId],
    enabled: !!filters.cycleId,
    queryFn: async () => {
      const params = new URLSearchParams({ cycleId: filters.cycleId });
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      const res = await fetch(`/api/reports/executive?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ExecutiveReport & {
        cycle: { id: string; name: string; fiscalYear: string; currentPhase: string };
      };
    },
    refetchInterval: REFETCH_MS,
  });

  return (
    <div className="space-y-8">
      <OrgPulseTicker />
      <AnalyticsFilters onChange={handleFilters} showDepartment showQuarter />

      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : data ? (
        <>
          <section id="overview">
            <FadeIn>
              <ExecutiveKpiRow kpis={data.kpis} />
            </FadeIn>
          </section>

          <section id="insights" className="mt-8">
            <FadeInView>
              <ExecutiveInsightsPanel insights={data.insights} />
            </FadeInView>
          </section>

          <section id="department-health" className="mt-8 grid gap-6 lg:grid-cols-3">
            <FadeInView className="lg:col-span-2">
              <DepartmentHealthHeatmap rows={data.departmentHealth} />
            </FadeInView>
            <FadeInView>
              <AtRiskPanel
                employees={data.atRiskEmployees}
                viewAllHref="/admin/escalations"
              />
            </FadeInView>
          </section>

          <section id="operations" className="mt-8">
            <FadeInView>
              <OperationalCommandCenter />
            </FadeInView>
          </section>

          <section id="alignment" className="mt-8 grid gap-6 lg:grid-cols-2">
            <FadeInView>
              <AlignmentTree tree={data.alignmentTree} />
            </FadeInView>
            <FadeInView>
              <EscalationIntelligence compact />
            </FadeInView>
          </section>

          <section id="escalations" className="mt-8">
            <FadeInView>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Escalation intelligence
              </h3>
              <EscalationIntelligence />
            </FadeInView>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Select a cycle to load executive intelligence.</p>
      )}
    </div>
  );
}
