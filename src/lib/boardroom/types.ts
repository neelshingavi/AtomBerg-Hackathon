import type { OrganizationPulse } from "@/lib/intelligence/types";
import type { IntelligenceInsight, LeadershipRecommendation, ExecutiveBriefing } from "@/lib/intelligence/types";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";
import type { DepartmentHealthRow } from "@/lib/reports/executive";

export type BriefingPeriod = "daily" | "weekly" | "quarterly";

export type BriefingFlowStepId =
  | "pulse"
  | "alignment"
  | "risks"
  | "predictive"
  | "managers"
  | "priorities"
  | "initiatives";

export type BriefingFlowStep = {
  id: BriefingFlowStepId;
  title: string;
  subtitle: string;
  narrative: string;
  anchor: string;
};

export type ExecutiveNarrative = {
  id: string;
  period: BriefingPeriod;
  headline: string;
  summary: string;
  paragraphs: string[];
  whyItMatters: string;
  generatedAt: string;
};

export type WhyItMattersItem = {
  id: string;
  metric: string;
  observation: string;
  businessImpact: string;
  urgency: "low" | "medium" | "high" | "critical";
};

export type LeadershipPriority = {
  id: string;
  rank: number;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high" | "critical";
  impact: "low" | "medium" | "high";
  confidence: number;
  departments: string[];
  category: string;
};

export type DepartmentStoryboard = {
  departmentId: string;
  department: string;
  completionPct: number;
  healthStatus: string;
  riskTrajectory: "improving" | "stable" | "declining";
  managerEffectiveness: number;
  escalationTrend: string;
  alignmentScore: number;
  collaborationNote: string;
  aiSummary: string;
  whyItMatters: string;
};

export type ManagerEffectivenessRow = {
  id: string;
  name: string;
  department?: string;
  responsiveness: number;
  approvalSpeed: number;
  escalationHandling: number;
  teamParticipation: number;
  executionConsistency: number;
  overallScore: number;
  narrative: string;
  trend: "strong" | "stable" | "declining";
};

export type TickerMetric = {
  key: string;
  label: string;
  value: string;
  delta?: string;
  trend: "up" | "down" | "flat";
};

export type InitiativeTrackItem = {
  id: string;
  title: string;
  owner: string;
  health: number;
  momentum: string;
  blockers: string[];
  successProbability: number;
  timelineConfidence: number;
};

export type BoardroomSnapshot = {
  cycleId: string;
  cycleName: string;
  generatedAt: string;
  pulse: OrganizationPulse;
  briefing: ExecutiveBriefing;
  narratives: ExecutiveNarrative[];
  whyItMatters: WhyItMattersItem[];
  insights: IntelligenceInsight[];
  recommendations: LeadershipRecommendation[];
  priorities: LeadershipPriority[];
  flowSteps: BriefingFlowStep[];
  departmentStoryboards: DepartmentStoryboard[];
  managers: ManagerEffectivenessRow[];
  ticker: TickerMetric[];
  initiatives: InitiativeTrackItem[];
  predictive?: PredictiveSnapshot;
  departmentHealth: DepartmentHealthRow[];
  timelineReplay: Array<{
    label: string;
    health: number;
    escalations: number;
    alignment: number;
    predicted?: boolean;
  }>;
  alignmentScore: number;
};
