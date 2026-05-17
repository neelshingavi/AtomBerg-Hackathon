import type { HealthStatus } from "./types";

export function scoreToHealthStatus(score: number): HealthStatus {
  if (score >= 75) return "healthy";
  if (score >= 50) return "warning";
  if (score >= 30) return "critical";
  return "blocker";
}

export function healthColor(status: HealthStatus): string {
  switch (status) {
    case "healthy":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "critical":
      return "#ef4444";
    case "blocker":
      return "#a855f7";
    default:
      return "#64748b";
  }
}

export function riskToLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function avgProgress(
  achievements: Array<{ progressScore: number | null; quarter: string; status?: string }>
): number {
  if (!achievements.length) return 0;
  const latest = [...achievements].sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
  return Math.round((latest?.progressScore ?? 0) * 1000) / 10;
}

export function computeHealthFromProgress(progressPct: number, atRiskCount = 0, escalationCount = 0): number {
  let score = progressPct;
  score -= atRiskCount * 8;
  score -= escalationCount * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
