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
import { OrganizationPulse } from "@/components/intelligence/OrganizationPulse";
import { AnomalyAlerts } from "@/components/intelligence/AnomalyAlerts";
import { InsightCarousel } from "@/components/intelligence/InsightCarousel";
import { NarrativeBriefing } from "@/components/intelligence/NarrativeBriefing";
import { LeadershipRecommendations } from "@/components/intelligence/LeadershipRecommendations";
import { ExecutiveAiSidebar } from "@/components/intelligence/ExecutiveAiSidebar";
import { ProductMissionBanner } from "@/components/brand/ProductMissionBanner";
import { TrustSignalsStrip } from "@/components/brand/TrustSignalsStrip";
import { OperationalDramaBanner } from "@/components/brand/OperationalDramaBanner";
import { useOrganizationPulse } from "@/hooks/useIntelligence";

const REFETCH_MS = 45_000;

export function ExecutiveDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilterValues>({ cycleId: "" });
  const { data: pulse } = useOrganizationPulse();

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

  const isCritical = pulse?.state === "critical" || pulse?.state === "at_risk";

  return (
    <div className="space-y-8">
      <ProductMissionBanner />
      <TrustSignalsStrip aiConfidence={pulse?.confidence} compact />
      <OperationalDramaBanner
        active={!!isCritical}
        headline={
          pulse?.state === "critical"
            ? "Critical organizational pulse — executive intervention required"
            : "Elevated execution risk detected across the organization"
        }
        impact={
          pulse?.narrative ??
          "Approval latency and misalignment may compound into quarterly target shortfall."
        }
        action="Convene leadership review in Executive Briefing Center and authorize cross-functional intervention"
      />
      <OrgPulseTicker />
      <AnomalyAlerts />
      <AnalyticsFilters onChange={handleFilters} showDepartment showQuarter />

      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : data ? (
        <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
          <div className="space-y-8 min-w-0">
          <OrganizationPulse />
          <NarrativeBriefing />
          <InsightCarousel />
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
              <div className="space-y-3">
                <AlignmentTree tree={data.alignmentTree} />
                <a
                  href="/admin/alignment"
                  className="inline-flex items-center text-sm font-medium text-brand-600 hover:underline"
                >
                  Open Strategic Alignment Network →
                </a>
              </div>
            </FadeInView>
            <FadeInView>
              <EscalationIntelligence compact />
            </FadeInView>
          </section>

          <section id="escalations" className="mt-8">
            <FadeInView>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Risk & escalation command
              </h3>
              <EscalationIntelligence />
            </FadeInView>
          </section>
          <LeadershipRecommendations />
          </div>
          <div className="hidden xl:block">
            <div className="sticky top-20">
              <ExecutiveAiSidebar />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a cycle to load executive intelligence.</p>
      )}
    </div>
  );
}
