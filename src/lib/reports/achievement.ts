import { prisma } from "@/lib/prisma";

export type AchievementReportRow = Record<string, string | number>;

export async function buildAchievementReport(params: {
  cycleId: string;
  departmentId?: string;
  quarter?: string | null;
}) {
  const { cycleId, departmentId, quarter } = params;

  const goalSheets = await prisma.goalSheet.findMany({
    where: {
      cycleId,
      isLocked: true,
      status: "APPROVED",
      ...(departmentId ? { employee: { departmentId } } : {}),
    },
    include: {
      employee: {
        include: { department: true, manager: true },
      },
      goals: {
        include: {
          thrustArea: true,
          achievements: quarter ? { where: { quarter } } : true,
        },
        orderBy: { order: "asc" },
      },
      cycle: true,
    },
    orderBy: [
      { employee: { department: { name: "asc" } } },
      { employee: { name: "asc" } },
    ],
  });

  const rows: AchievementReportRow[] = [];

  for (const sheet of goalSheets) {
    for (const goal of sheet.goals) {
      const baseRow: AchievementReportRow = {
        "Employee Code": sheet.employee.employeeCode,
        "Employee Name": sheet.employee.name,
        Department: sheet.employee.department.name,
        Manager: sheet.employee.manager?.name ?? "—",
        "Goal Title": goal.title,
        "Thrust Area": goal.thrustArea.name,
        "UoM Type": goal.uomType,
        "Weightage (%)": goal.weightage,
        "Planned Target": goal.plannedTarget,
        Unit: goal.unit ?? "—",
      };

      if (quarter && quarter !== "ALL") {
        const achievement = goal.achievements[0];
        rows.push({
          ...baseRow,
          [`${quarter} Actual`]: achievement?.actualValue ?? "—",
          [`${quarter} Score (%)`]: achievement?.progressScore
            ? Math.round(achievement.progressScore * 100)
            : "—",
          [`${quarter} Status`]: achievement?.status ?? "NOT_STARTED",
        });
      } else {
        const achievementMap = Object.fromEntries(
          goal.achievements.map((a) => [a.quarter, a])
        );
        rows.push({
          ...baseRow,
          "Q1 Actual": achievementMap.Q1?.actualValue ?? "—",
          "Q1 Score (%)": achievementMap.Q1?.progressScore
            ? Math.round(achievementMap.Q1.progressScore * 100)
            : "—",
          "Q2 Actual": achievementMap.Q2?.actualValue ?? "—",
          "Q2 Score (%)": achievementMap.Q2?.progressScore
            ? Math.round(achievementMap.Q2.progressScore * 100)
            : "—",
          "Q3 Actual": achievementMap.Q3?.actualValue ?? "—",
          "Q3 Score (%)": achievementMap.Q3?.progressScore
            ? Math.round(achievementMap.Q3.progressScore * 100)
            : "—",
          "Q4 Actual": achievementMap.Q4?.actualValue ?? "—",
          "Q4 Score (%)": achievementMap.Q4?.progressScore
            ? Math.round(achievementMap.Q4.progressScore * 100)
            : "—",
        });
      }
    }
  }

  return { rows, cycleName: goalSheets[0]?.cycle?.name ?? "—", goalSheets };
}
