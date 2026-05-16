import type { CyclePhase, GoalCycle } from "@prisma/client";

/** True only during the configured goal-setting date range. */
export function isGoalSettingOpen(cycle: GoalCycle): boolean {
  const now = new Date();
  return now >= cycle.goalSettingStart && now <= cycle.goalSettingEnd;
}

export function getCurrentPhase(cycle: GoalCycle): CyclePhase {
  const now = new Date();

  if (isGoalSettingOpen(cycle)) {
    return "GOAL_SETTING";
  }
  if (now >= cycle.q1WindowStart && now <= cycle.q1WindowEnd) {
    return "Q1_CHECKIN";
  }
  if (now >= cycle.q2WindowStart && now <= cycle.q2WindowEnd) {
    return "Q2_CHECKIN";
  }
  if (now >= cycle.q3WindowStart && now <= cycle.q3WindowEnd) {
    return "Q3_CHECKIN";
  }
  if (now >= cycle.q4WindowStart && now <= cycle.q4WindowEnd) {
    return "Q4_ANNUAL";
  }
  // Before cycle starts, between windows, or after Q4 — no active phase
  return "CLOSED";
}

export function isWindowOpen(cycle: GoalCycle, phase: CyclePhase): boolean {
  return getCurrentPhase(cycle) === phase;
}

export function getActiveQuarter(cycle: GoalCycle): string | null {
  const phase = getCurrentPhase(cycle);
  const map: Partial<Record<CyclePhase, string>> = {
    Q1_CHECKIN: "Q1",
    Q2_CHECKIN: "Q2",
    Q3_CHECKIN: "Q3",
    Q4_ANNUAL: "Q4",
  };
  return map[phase] ?? null;
}

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

const QUARTER_PHASE: Record<Quarter, CyclePhase> = {
  Q1: "Q1_CHECKIN",
  Q2: "Q2_CHECKIN",
  Q3: "Q3_CHECKIN",
  Q4: "Q4_ANNUAL",
};

export function getQuarterWindow(
  cycle: GoalCycle,
  quarter: Quarter
): { start: Date; end: Date } {
  switch (quarter) {
    case "Q1":
      return { start: cycle.q1WindowStart, end: cycle.q1WindowEnd };
    case "Q2":
      return { start: cycle.q2WindowStart, end: cycle.q2WindowEnd };
    case "Q3":
      return { start: cycle.q3WindowStart, end: cycle.q3WindowEnd };
    case "Q4":
      return { start: cycle.q4WindowStart, end: cycle.q4WindowEnd };
  }
}

export function isQuarterWindowOpen(cycle: GoalCycle, quarter: Quarter): boolean {
  const now = new Date();
  const { start, end } = getQuarterWindow(cycle, quarter);
  return now >= start && now <= end;
}

export function quarterToPhase(quarter: Quarter): CyclePhase {
  return QUARTER_PHASE[quarter];
}

export function formatQuarterWindow(cycle: GoalCycle, quarter: Quarter): string {
  const { start, end } = getQuarterWindow(cycle, quarter);
  return `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function getPhaseLabel(phase: CyclePhase): string {
  const labels: Record<CyclePhase, string> = {
    GOAL_SETTING: "Goal Setting",
    Q1_CHECKIN: "Q1 Check-in",
    Q2_CHECKIN: "Q2 Check-in",
    Q3_CHECKIN: "Q3 Check-in",
    Q4_ANNUAL: "Q4 / Annual Review",
    CLOSED: "Cycle Closed",
  };
  return labels[phase];
}

export async function getActiveCycle() {
  const { prisma } = await import("@/lib/prisma");
  const config = await prisma.systemConfig.findUnique({
    where: { key: "active_cycle_id" },
  });
  if (config?.value) {
    const cycle = await prisma.goalCycle.findUnique({ where: { id: config.value } });
    if (cycle) return cycle;
  }
  return prisma.goalCycle.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
}
