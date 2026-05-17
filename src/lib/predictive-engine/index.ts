import { buildIntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { getCached, setCache } from "@/lib/intelligence/cache";
import { buildHistoricalSeries } from "./historical";
import { buildRiskPredictions } from "./risk-forecast";
import { buildTrajectories } from "./trajectory";
import { computeMomentum } from "./momentum";
import { predictBottlenecks } from "./bottlenecks";
import { forecastInitiatives } from "./initiatives";
import { computeStability } from "./stability";
import { buildEarlyWarnings } from "./early-warnings";
import { buildInterventions } from "./interventions";
import type {
  PredictiveSnapshot,
  ForecastHorizon,
  RiskRadarItem,
  HeatmapCell,
} from "./types";
import { severityFromProbability } from "./utils";

export async function buildPredictiveSnapshot(
  cycleId: string,
  horizon: ForecastHorizon = "quarter"
): Promise<PredictiveSnapshot> {
  const cacheKey = `intel:forecast:${cycleId}:${horizon}`;
  const cached = getCached<PredictiveSnapshot>(cacheKey);
  if (cached) return cached;

  const snapshot = await buildIntelligenceSnapshot(cycleId);
  const [history, initiatives] = await Promise.all([
    buildHistoricalSeries(cycleId),
    forecastInitiatives(cycleId, snapshot),
  ]);

  const predictions = buildRiskPredictions(snapshot, history, horizon);
  const bottlenecks = predictBottlenecks(snapshot);
  const trajectories = buildTrajectories(snapshot, history);
  const momentum = computeMomentum(snapshot, history);
  const stability = computeStability(snapshot, history);
  const earlyWarnings = buildEarlyWarnings(snapshot, history);
  const interventions = buildInterventions({ predictions, bottlenecks, warnings: earlyWarnings });
  const riskRadar = buildRiskRadar(predictions, bottlenecks);
  const heatmap = buildHeatmap(snapshot, predictions);
  const timelineReplay = buildTimelineReplay(history, trajectories);

  const topRisk = predictions[0];
  const overallRiskOutlook = topRisk
    ? severityFromProbability(topRisk.probability)
    : "low";

  const executiveNarrative = buildExecutiveNarrative({
    momentum,
    stability,
    topRisk,
    trajectories,
    horizon,
  });

  const payload: PredictiveSnapshot = {
    cycleId,
    cycleName: snapshot.cycleName,
    generatedAt: new Date().toISOString(),
    horizon,
    executiveNarrative,
    overallRiskOutlook,
    predictions,
    bottlenecks,
    trajectories,
    momentum,
    stability,
    initiatives,
    earlyWarnings,
    interventions,
    riskRadar,
    heatmap,
    timelineReplay,
  };

  setCache(cacheKey, payload, 60_000);
  return payload;
}

function buildRiskRadar(
  predictions: PredictiveSnapshot["predictions"],
  bottlenecks: PredictiveSnapshot["bottlenecks"]
): RiskRadarItem[] {
  const items: RiskRadarItem[] = [];
  const combined = [
    ...predictions.slice(0, 6).map((p) => ({
      id: p.id,
      label: p.title.slice(0, 28),
      category: p.category,
      probability: p.probability,
      severity: p.severity,
    })),
    ...bottlenecks.slice(0, 4).map((b) => ({
      id: b.id,
      label: b.title.slice(0, 28),
      category: b.type,
      probability: b.probability,
      severity: b.severity,
    })),
  ];

  combined.forEach((item, i) => {
    const angle = (i / Math.max(combined.length, 1)) * 360;
    items.push({
      ...item,
      angle,
      distance: item.probability,
    });
  });

  return items;
}

function buildHeatmap(
  snapshot: Awaited<ReturnType<typeof buildIntelligenceSnapshot>>,
  predictions: PredictiveSnapshot["predictions"]
): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const cols = ["Execution", "Approvals", "Escalations", "Strategic"];

  for (const dept of snapshot.executive.departmentHealth) {
    const pred = predictions.find((p) => p.affectedDepartments.includes(dept.department));
    cells.push({
      id: `${dept.departmentId}-exec`,
      row: dept.department,
      col: cols[0],
      value: 100 - dept.completionPct,
      label: `${100 - dept.completionPct}% risk`,
      severity: severityFromProbability(100 - dept.completionPct),
    });
    cells.push({
      id: `${dept.departmentId}-appr`,
      row: dept.department,
      col: cols[1],
      value: Math.min(100, dept.delayedApprovals * 20),
      label: `${dept.delayedApprovals} delayed`,
      severity: dept.delayedApprovals >= 3 ? "high" : "medium",
    });
    cells.push({
      id: `${dept.departmentId}-esc`,
      row: dept.department,
      col: cols[2],
      value: Math.min(100, dept.escalationCount * 15),
      label: `${dept.escalationCount} esc`,
      severity: dept.escalationCount >= 2 ? "high" : "low",
    });
    cells.push({
      id: `${dept.departmentId}-strat`,
      row: dept.department,
      col: cols[3],
      value: pred?.probability ?? dept.riskScore,
      label: pred ? `${pred.probability}%` : `${dept.riskScore} risk`,
      severity: pred?.severity ?? severityFromProbability(dept.riskScore),
    });
  }

  return cells;
}

function buildTimelineReplay(
  history: Awaited<ReturnType<typeof buildHistoricalSeries>>,
  trajectories: PredictiveSnapshot["trajectories"]
): PredictiveSnapshot["timelineReplay"] {
  const healthTraj = trajectories.find((t) => t.metric === "health");
  const replay = history.labels.map((label, i) => ({
    timestamp: label,
    label,
    healthScore: history.health[i],
    riskScore: Math.max(0, 100 - history.health[i]),
    escalationCount: history.escalations[i],
    predicted: false,
  }));

  if (healthTraj) {
    for (const pt of healthTraj.points.filter((p) => !p.actual)) {
      replay.push({
        timestamp: pt.period,
        label: pt.label,
        healthScore: Math.round(pt.predicted),
        riskScore: Math.round(100 - pt.predicted),
        escalationCount: 0,
        predicted: true,
      });
    }
  }

  return replay;
}

function buildExecutiveNarrative(params: {
  momentum: PredictiveSnapshot["momentum"];
  stability: PredictiveSnapshot["stability"];
  topRisk?: PredictiveSnapshot["predictions"][0];
  trajectories: PredictiveSnapshot["trajectories"];
  horizon: ForecastHorizon;
}): string {
  const completionTraj = params.trajectories.find((t) => t.metric === "completion");
  const parts: string[] = [];

  parts.push(
    `Organizational momentum is ${params.momentum.trend} at ${params.momentum.overall}/100 with ${params.stability.overall}% workforce stability.`
  );

  if (completionTraj) {
    parts.push(
      `Goal completion is projected to reach ${completionTraj.projected}% (${completionTraj.direction}) over the ${params.horizon === "quarter" ? "next quarter" : "forecast horizon"}.`
    );
  }

  if (params.topRisk) {
    parts.push(
      `Highest-probability risk: ${params.topRisk.title} (${params.topRisk.probability}% probability, ${params.topRisk.confidence}% confidence).`
    );
  }

  return parts.join(" ");
}

export { runScenario, PRESET_SCENARIOS } from "./simulations";
export type { ScenarioInput, ScenarioResult } from "./types";
export type { PredictiveSnapshot, ForecastHorizon } from "./types";
