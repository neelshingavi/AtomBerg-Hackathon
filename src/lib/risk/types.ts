export type RiskLevel = "healthy" | "warning" | "critical";

export type RiskFactor =
  | "overdue_approval"
  | "low_goal_progress"
  | "missed_checkin"
  | "inactive_employee"
  | "delayed_manager"
  | "repeated_escalation"
  | "low_completion_trend";

export type RiskEntity = {
  id: string;
  name: string;
  type: "employee" | "manager" | "department";
  score: number;
  level: RiskLevel;
  factors: Array<{ factor: RiskFactor; label: string; weight: number }>;
  daysOverdue?: number;
  department?: string;
  managerName?: string;
  affectedGoals?: number;
  escalationCount?: number;
};

export function scoreToLevel(score: number): RiskLevel {
  if (score <= 30) return "healthy";
  if (score <= 60) return "warning";
  return "critical";
}

export function levelColor(level: RiskLevel): string {
  switch (level) {
    case "healthy":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#ef4444";
  }
}
