export type InsightPriority = "informational" | "positive" | "warning" | "critical";

export type HealthState = "excellent" | "healthy" | "watchlist" | "at_risk" | "critical";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type IntelligenceInsight = {
  id: string;
  priority: InsightPriority;
  category:
    | "department"
    | "manager"
    | "cycle"
    | "escalation"
    | "risk"
    | "approval"
    | "execution"
    | "alignment";
  title: string;
  body: string;
  metric?: string;
  trendPct?: number;
  recommendation?: string;
  affectedDepartments?: string[];
  confidence: number;
};

export type LeadershipRecommendation = {
  id: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  confidence: number;
  impact: "low" | "medium" | "high";
  affectedCount?: number;
  departments?: string[];
  managers?: string[];
  actionLabel: string;
  href?: string;
  factors: string[];
};

export type AnomalyAlert = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: InsightPriority;
  deltaPct?: number;
  currentValue: number;
  previousValue: number;
  confidence: number;
};

export type CopilotResponse = {
  summary: string;
  reasoning: string[];
  metrics: Array<{ label: string; value: string | number }>;
  recommendations: string[];
  affectedDepartments: string[];
  affectedManagers: string[];
  urgency: UrgencyLevel;
  confidence: number;
  factors: Array<{ factor: string; contribution: number }>;
};

export type OrganizationPulse = {
  overallScore: number;
  state: HealthState;
  stateLabel: string;
  confidence: number;
  trendPct: number;
  previousScore: number;
  narrative: string;
  factors: Array<{
    key: string;
    label: string;
    score: number;
    weight: number;
    trend: "up" | "down" | "stable";
  }>;
  departments: Array<{
    id: string;
    name: string;
    score: number;
    state: HealthState;
    trendPct: number;
    narrative: string;
  }>;
  managers: Array<{
    id: string;
    name: string;
    score: number;
    state: HealthState;
    department?: string;
  }>;
  cycleScore: number;
  sparkline: number[];
};

export type WhatChangedItem = {
  metric: string;
  direction: "up" | "down" | "stable";
  deltaPct: number;
  current: number;
  previous: number;
  interpretation: string;
};

export type ExecutiveBriefing = {
  id: string;
  type: "organization" | "department" | "escalation" | "risk";
  title: string;
  generatedAt: string;
  summary: string;
  developments: string[];
  risks: string[];
  recommendations: string[];
  nextActions: string[];
};
