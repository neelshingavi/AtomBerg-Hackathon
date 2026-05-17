import type { InsightPriority } from "@/lib/intelligence/types";

export type ForecastHorizon = "30d" | "90d" | "quarter" | "cycle";

export type PredictiveSeverity = "low" | "medium" | "high" | "critical";

export type ForecastPoint = {
  period: string;
  label: string;
  actual?: number;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
};

export type PredictedRisk = {
  id: string;
  category:
    | "approval_bottleneck"
    | "missed_checkin"
    | "escalation_spike"
    | "execution_failure"
    | "manager_overload"
    | "strategic_risk"
    | "participation_decline"
    | "dependency_block";
  title: string;
  narrative: string;
  probability: number;
  confidence: number;
  severity: PredictiveSeverity;
  projectedImpact: string;
  horizon: ForecastHorizon;
  affectedDepartments: string[];
  affectedManagers: string[];
  affectedUserIds?: string[];
  factors: Array<{ factor: string; weight: number; direction: "up" | "down" }>;
};

export type PredictedBottleneck = {
  id: string;
  type: "manager" | "approval" | "dependency" | "team" | "escalation" | "cycle";
  title: string;
  description: string;
  probability: number;
  confidence: number;
  severity: PredictiveSeverity;
  department?: string;
  managerName?: string;
  daysUntilImpact?: number;
};

export type MomentumScore = {
  overall: number;
  acceleration: number;
  trend: "accelerating" | "stable" | "decelerating";
  departments: Array<{ id: string; name: string; score: number; trend: string }>;
  initiatives: Array<{ id: string; label: string; score: number }>;
};

export type StabilityMetrics = {
  overall: number;
  engagementConsistency: number;
  participationReliability: number;
  managerResponsiveness: number;
  operationalResilience: number;
  executionVolatility: number;
  narrative: string;
};

export type InitiativeForecast = {
  id: string;
  title: string;
  successProbability: number;
  confidence: number;
  riskContributors: string[];
  projectedDelayDays?: number;
  thrustArea?: string;
};

export type EarlyWarning = {
  id: string;
  type: InsightPriority;
  title: string;
  message: string;
  metric?: string;
  trendDirection: "up" | "down";
  confidence: number;
  department?: string;
  createdAt: string;
};

export type InterventionRecommendation = {
  id: string;
  title: string;
  description: string;
  priority: PredictiveSeverity;
  confidence: number;
  expectedImpact: string;
  targetDepartments: string[];
  actionType: "approval" | "checkin" | "escalation" | "manager" | "strategic" | "dependency";
};

export type TrajectoryForecast = {
  metric: string;
  label: string;
  current: number;
  projected: number;
  direction: "improving" | "stable" | "declining";
  confidence: number;
  points: ForecastPoint[];
};

export type RiskRadarItem = {
  id: string;
  label: string;
  category: string;
  probability: number;
  severity: PredictiveSeverity;
  angle: number;
  distance: number;
};

export type HeatmapCell = {
  id: string;
  row: string;
  col: string;
  value: number;
  label: string;
  severity: PredictiveSeverity;
};

export type ScenarioInput = {
  approvalDelayPct?: number;
  escalationMultiplier?: number;
  checkinMissRatePct?: number;
  managerResponsivenessPct?: number;
  sharedGoalFailurePct?: number;
  engineeringMissMilestones?: boolean;
};

export type ScenarioResult = {
  scenarioLabel: string;
  baseline: {
    healthScore: number;
    completionPct: number;
    escalationCount: number;
    alignmentScore: number;
  };
  projected: {
    healthScore: number;
    completionPct: number;
    escalationCount: number;
    alignmentScore: number;
  };
  deltas: Array<{ metric: string; change: number; unit: string }>;
  narrative: string;
  confidence: number;
};

export type PredictiveSnapshot = {
  cycleId: string;
  cycleName: string;
  generatedAt: string;
  horizon: ForecastHorizon;
  executiveNarrative: string;
  overallRiskOutlook: PredictiveSeverity;
  predictions: PredictedRisk[];
  bottlenecks: PredictedBottleneck[];
  trajectories: TrajectoryForecast[];
  momentum: MomentumScore;
  stability: StabilityMetrics;
  initiatives: InitiativeForecast[];
  earlyWarnings: EarlyWarning[];
  interventions: InterventionRecommendation[];
  riskRadar: RiskRadarItem[];
  heatmap: HeatmapCell[];
  timelineReplay: Array<{
    timestamp: string;
    label: string;
    healthScore: number;
    riskScore: number;
    escalationCount: number;
    predicted?: boolean;
  }>;
};
