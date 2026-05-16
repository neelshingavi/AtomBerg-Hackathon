import type { GoalStatus, Prisma } from "@prisma/client";

export const goalSheetInclude = {
  employee: {
    select: {
      id: true,
      name: true,
      employeeCode: true,
      email: true,
      department: { select: { id: true, name: true, code: true } },
    },
  },
  manager: { select: { id: true, name: true, employeeCode: true } },
  cycle: {
    select: {
      id: true,
      name: true,
      fiscalYear: true,
      currentPhase: true,
      goalSettingStart: true,
      goalSettingEnd: true,
    },
  },
  goals: {
    orderBy: { order: "asc" as const },
    include: {
      thrustArea: { select: { id: true, name: true, color: true } },
      achievements: true,
    },
  },
} satisfies Prisma.GoalSheetInclude;

export function serializeGoalSheet(
  sheet: Prisma.GoalSheetGetPayload<{ include: typeof goalSheetInclude }>
) {
  const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);
  return {
    ...sheet,
    totalWeightage,
    goalsCount: sheet.goals.length,
  };
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  priority?: import("@prisma/client").NotificationPriority;
  category?: import("@prisma/client").NotificationCategory;
  entityType?: string;
  entityId?: string;
}) {
  const { createEnhancedNotification } = await import("@/lib/notifications/enhanced");
  return createEnhancedNotification(params);
}

export function editableStatuses(): GoalStatus[] {
  return ["DRAFT", "REWORK"];
}
