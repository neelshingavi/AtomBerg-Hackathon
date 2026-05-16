import type { UoMType } from "@prisma/client";

export interface ProgressInput {
  uomType: UoMType;
  plannedTarget: number;
  actualValue?: number | null;
  targetDeadline?: Date | null;
  completionDate?: Date | null;
}

export interface ProgressResult {
  score: number;
  percentage: number;
  displayScore: string;
  isOverachieved: boolean;
}

export function calculateProgress(input: ProgressInput): ProgressResult {
  const { uomType, plannedTarget, actualValue, targetDeadline, completionDate } = input;

  let score = 0;

  switch (uomType) {
    case "NUMERIC_MIN":
    case "PERCENTAGE_MIN": {
      if (actualValue == null || plannedTarget === 0) {
        return { score: 0, percentage: 0, displayScore: "—", isOverachieved: false };
      }
      score = actualValue / plannedTarget;
      break;
    }

    case "NUMERIC_MAX":
    case "PERCENTAGE_MAX": {
      if (actualValue == null || actualValue === 0) {
        return { score: 0, percentage: 0, displayScore: "—", isOverachieved: false };
      }
      score = plannedTarget / actualValue;
      break;
    }

    case "TIMELINE": {
      if (!completionDate || !targetDeadline) {
        return { score: 0, percentage: 0, displayScore: "Pending", isOverachieved: false };
      }
      if (completionDate <= targetDeadline) {
        score = 1.0;
      } else {
        const daysLate = Math.floor(
          (completionDate.getTime() - targetDeadline.getTime()) / (1000 * 60 * 60 * 24)
        );
        score = Math.max(0, 1 - daysLate * 0.05);
      }
      break;
    }

    case "ZERO_BASED": {
      if (actualValue == null) {
        return { score: 0, percentage: 0, displayScore: "—", isOverachieved: false };
      }
      score = actualValue === 0 ? 1.0 : 0.0;
      break;
    }

    default:
      score = 0;
  }

  const percentage = Math.round(score * 100);
  const isOverachieved = score > 1;

  let displayScore: string;
  if (uomType === "ZERO_BASED") {
    displayScore = score === 1 ? "Achieved ✓" : "Not Achieved ✗";
  } else if (uomType === "TIMELINE") {
    displayScore = score === 1 ? "On Time ✓" : `Late (${Math.round(score * 100)}%)`;
  } else {
    displayScore = `${percentage}%`;
  }

  return { score, percentage, displayScore, isOverachieved };
}

export function calculateSheetScore(
  goals: Array<{
    weightage: number;
    achievements: Array<{ progressScore: number | null; quarter: string }>;
  }>,
  quarter: string
): number {
  let totalWeightedScore = 0;
  let totalWeightage = 0;

  for (const goal of goals) {
    const achievement = goal.achievements.find((a) => a.quarter === quarter);
    if (achievement?.progressScore != null) {
      totalWeightedScore += (goal.weightage / 100) * achievement.progressScore;
      totalWeightage += goal.weightage;
    }
  }

  if (totalWeightage === 0) return 0;
  return totalWeightedScore * (100 / totalWeightage);
}
