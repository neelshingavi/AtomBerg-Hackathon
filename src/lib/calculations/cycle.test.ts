import { describe, it, expect, afterEach, vi } from "vitest";
import type { GoalCycle } from "@prisma/client";
import { getCurrentPhase, isGoalSettingOpen } from "@/lib/cycle";

const baseCycle: GoalCycle = {
  id: "test",
  name: "FY Test",
  fiscalYear: "2025-26",
  isActive: true,
  currentPhase: "GOAL_SETTING",
  goalSettingStart: new Date("2026-01-01"),
  goalSettingEnd: new Date("2026-01-31"),
  q1WindowStart: new Date("2026-04-01"),
  q1WindowEnd: new Date("2026-04-30"),
  q2WindowStart: new Date("2026-07-01"),
  q2WindowEnd: new Date("2026-07-31"),
  q3WindowStart: new Date("2026-10-01"),
  q3WindowEnd: new Date("2026-10-31"),
  q4WindowStart: new Date("2027-01-01"),
  q4WindowEnd: new Date("2027-03-31"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getCurrentPhase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns GOAL_SETTING only inside goal-setting window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    expect(getCurrentPhase(baseCycle)).toBe("GOAL_SETTING");
    expect(isGoalSettingOpen(baseCycle)).toBe(true);
  });

  it("returns CLOSED in gap after goal setting (not GOAL_SETTING)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15"));
    expect(getCurrentPhase(baseCycle)).toBe("CLOSED");
    expect(isGoalSettingOpen(baseCycle)).toBe(false);
  });

  it("returns Q1_CHECKIN during Q1 window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15"));
    expect(getCurrentPhase(baseCycle)).toBe("Q1_CHECKIN");
    expect(isGoalSettingOpen(baseCycle)).toBe(false);
  });
});
