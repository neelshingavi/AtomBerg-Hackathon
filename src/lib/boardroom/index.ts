import { buildIntelligenceSnapshot, kpiMap } from "@/lib/intelligence/snapshot";
import { computeOrganizationPulse } from "@/lib/health-engine";
import { generateExecutiveBriefing } from "@/lib/ai/summaries";
import { generateIntelligenceInsights } from "@/lib/insights/generator";
import { generateLeadershipRecommendations } from "@/lib/recommendations/engine";
import { buildPredictiveSnapshot } from "@/lib/predictive-engine";
import { buildAlignmentGraph } from "@/lib/alignment/build-graph";
import { getCached, setCache } from "@/lib/intelligence/cache";
import { generateExecutiveNarratives, generateWhyItMatters } from "./narratives";
import { generateLeadershipPriorities } from "./priorities";
import { buildDepartmentStoryboards } from "./storyboards";
import { buildManagerEffectiveness } from "./manager-intel";
import { buildBriefingFlow } from "./flow";
import type { BoardroomSnapshot, TickerMetric, InitiativeTrackItem } from "./types";

export async function buildBoardroomSnapshot(cycleId: string): Promise<BoardroomSnapshot> {
  const cacheKey = `intel:boardroom:${cycleId}`;
  const cached = getCached<BoardroomSnapshot>(cacheKey);
  if (cached) return cached;

  const snapshot = await buildIntelligenceSnapshot(cycleId);

  const [pulse, briefing, predictive, alignmentGraph] = await Promise.all([
    computeOrganizationPulse(cycleId),
    generateExecutiveBriefing(cycleId, "organization"),
    buildPredictiveSnapshot(cycleId, "quarter").catch(() => undefined),
    buildAlignmentGraph(cycleId, { includeGoals: false }).catch(() => null),
  ]);

  const kpis = kpiMap(snapshot);
  const insights = generateIntelligenceInsights(snapshot);
  const recommendations = generateLeadershipRecommendations(snapshot);
  const narratives = generateExecutiveNarratives({ snapshot, pulse, predictive });
  const whyItMatters = generateWhyItMatters({ snapshot, pulse, predictive });
  const priorities = generateLeadershipPriorities({ snapshot, predictive });
  const departmentStoryboards = buildDepartmentStoryboards(snapshot);
  const managers = buildManagerEffectiveness(snapshot);
  const ticker = buildTickerMetrics(snapshot, pulse, predictive, alignmentGraph?.scores.overallScore);
  const initiatives = buildInitiativeTracks(predictive);
  const timelineReplay = buildTimelineReplay(predictive, pulse);

  const partial: BoardroomSnapshot = {
    cycleId,
    cycleName: snapshot.cycleName,
    generatedAt: new Date().toISOString(),
    pulse,
    briefing,
    narratives,
    whyItMatters,
    insights,
    recommendations,
    priorities,
    flowSteps: [],
    departmentStoryboards,
    managers,
    ticker,
    initiatives,
    predictive,
    departmentHealth: snapshot.executive.departmentHealth,
    timelineReplay,
    alignmentScore: alignmentGraph?.scores.overallScore ?? kpis.sharedGoalAdoption ?? 0,
  };

  partial.flowSteps = buildBriefingFlow(partial);
  setCache(cacheKey, partial, 60_000);
  return partial;
}

function buildTickerMetrics(
  snapshot: Awaited<ReturnType<typeof buildIntelligenceSnapshot>>,
  pulse: Awaited<ReturnType<typeof computeOrganizationPulse>>,
  predictive?: Awaited<ReturnType<typeof buildPredictiveSnapshot>>,
  alignmentScore?: number
): TickerMetric[] {
  const kpis = kpiMap(snapshot);
  const completionKpi = snapshot.executive.kpis.find((k) => k.key === "orgGoalCompletion");

  return [
    {
      key: "pulse",
      label: "Org Health",
      value: `${pulse.overallScore}`,
      delta: `${pulse.trendPct > 0 ? "+" : ""}${pulse.trendPct}`,
      trend: pulse.trendPct > 0 ? "up" : pulse.trendPct < 0 ? "down" : "flat",
    },
    {
      key: "escalations",
      label: "Escalations",
      value: String(kpis.activeEscalations ?? 0),
      trend: (kpis.activeEscalations ?? 0) > 8 ? "up" : "flat",
    },
    {
      key: "approvals",
      label: "Delayed Approvals",
      value: String(kpis.delayedApprovals ?? 0),
      trend: (kpis.delayedApprovals ?? 0) > 3 ? "up" : "down",
    },
    {
      key: "completion",
      label: "Strategic Completion",
      value: `${kpis.orgGoalCompletion ?? 0}%`,
      delta: completionKpi ? `${completionKpi.trendPct > 0 ? "+" : ""}${completionKpi.trendPct}%` : undefined,
      trend: (completionKpi?.trendPct ?? 0) >= 0 ? "up" : "down",
    },
    {
      key: "risks",
      label: "At-Risk Workforce",
      value: String(kpis.atRiskEmployees ?? 0),
      trend: (kpis.atRiskEmployees ?? 0) > 5 ? "up" : "flat",
    },
    {
      key: "alignment",
      label: "Alignment",
      value: `${alignmentScore ?? kpis.sharedGoalAdoption ?? 0}%`,
      trend: "flat",
    },
    {
      key: "momentum",
      label: "Momentum",
      value: `${predictive?.momentum.overall ?? pulse.overallScore}`,
      trend:
        predictive?.momentum.trend === "accelerating"
          ? "up"
          : predictive?.momentum.trend === "decelerating"
            ? "down"
            : "flat",
    },
  ];
}

function buildInitiativeTracks(
  predictive?: Awaited<ReturnType<typeof buildPredictiveSnapshot>>
): InitiativeTrackItem[] {
  if (!predictive) return [];
  return predictive.initiatives.map((init) => ({
    id: init.id,
    title: init.title,
    owner: init.thrustArea ?? "Organization",
    health: init.successProbability,
    momentum: init.successProbability >= 60 ? "On track" : "At risk",
    blockers: init.riskContributors,
    successProbability: init.successProbability,
    timelineConfidence: init.confidence,
  }));
}

function buildTimelineReplay(
  predictive?: Awaited<ReturnType<typeof buildPredictiveSnapshot>>,
  pulse?: Awaited<ReturnType<typeof computeOrganizationPulse>>
) {
  if (predictive?.timelineReplay.length) {
    return predictive.timelineReplay.map((t) => ({
      label: t.label,
      health: t.healthScore,
      escalations: t.escalationCount,
      alignment: Math.max(0, 100 - t.riskScore),
      predicted: t.predicted,
    }));
  }
  return [
    { label: "Now", health: pulse?.overallScore ?? 70, escalations: 0, alignment: 65 },
  ];
}

export type { BoardroomSnapshot } from "./types";
