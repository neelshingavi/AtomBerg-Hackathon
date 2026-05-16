import { describe, it, expect } from "vitest";
import { calculateProgress, calculateSheetScore } from "./progress";

describe("calculateProgress", () => {
  it("NUMERIC_MIN: calculates score correctly", () => {
    const result = calculateProgress({
      uomType: "NUMERIC_MIN",
      plannedTarget: 50,
      actualValue: 35,
    });
    expect(result.score).toBeCloseTo(0.7);
    expect(result.percentage).toBe(70);
    expect(result.isOverachieved).toBe(false);
  });

  it("NUMERIC_MAX: scores higher when actual is lower than target", () => {
    const result = calculateProgress({
      uomType: "NUMERIC_MAX",
      plannedTarget: 3,
      actualValue: 2,
    });
    expect(result.score).toBeCloseTo(1.5);
    expect(result.isOverachieved).toBe(true);
  });

  it("ZERO_BASED: zero actual = 100%", () => {
    const result = calculateProgress({
      uomType: "ZERO_BASED",
      plannedTarget: 0,
      actualValue: 0,
    });
    expect(result.score).toBe(1.0);
    expect(result.displayScore).toBe("Achieved ✓");
  });

  it("ZERO_BASED: non-zero actual = 0%", () => {
    const result = calculateProgress({
      uomType: "ZERO_BASED",
      plannedTarget: 0,
      actualValue: 3,
    });
    expect(result.score).toBe(0);
    expect(result.displayScore).toBe("Not Achieved ✗");
  });

  it("TIMELINE: on-time completion = 100%", () => {
    const result = calculateProgress({
      uomType: "TIMELINE",
      plannedTarget: 0,
      targetDeadline: new Date("2025-09-30"),
      completionDate: new Date("2025-09-25"),
    });
    expect(result.score).toBe(1.0);
    expect(result.percentage).toBe(100);
  });

  it("TIMELINE: late completion reduces score", () => {
    const result = calculateProgress({
      uomType: "TIMELINE",
      plannedTarget: 0,
      targetDeadline: new Date("2025-09-01"),
      completionDate: new Date("2025-09-11"),
    });
    expect(result.score).toBeLessThan(1);
    expect(result.score).toBeGreaterThan(0);
  });
});

describe("calculateSheetScore", () => {
  it("weights achievements by goal weightage", () => {
    const score = calculateSheetScore(
      [
        {
          weightage: 60,
          achievements: [{ quarter: "Q1", progressScore: 0.8 }],
        },
        {
          weightage: 40,
          achievements: [{ quarter: "Q1", progressScore: 1.0 }],
        },
      ],
      "Q1"
    );
    expect(score).toBeCloseTo(0.88, 1);
  });
});
