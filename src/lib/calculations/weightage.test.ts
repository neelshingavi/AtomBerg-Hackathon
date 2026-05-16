import { describe, it, expect } from "vitest";
import { validateSubmission, validateWeightage } from "./weightage";

describe("validateSubmission", () => {
  it("fails when total weightage != 100", () => {
    const result = validateSubmission([
      { title: "Goal A", weightage: 60 },
      { title: "Goal B", weightage: 30 },
    ]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("100%"))).toBe(true);
  });

  it("fails when any goal has < 10% weightage", () => {
    const result = validateSubmission([
      { title: "Goal A", weightage: 91 },
      { title: "Goal B", weightage: 9 },
    ]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("minimum is 10%"))).toBe(true);
  });

  it("fails when more than 8 goals", () => {
    const goals = Array.from({ length: 9 }, (_, i) => ({
      title: `Goal ${i}`,
      weightage: 11,
    }));
    const result = validateSubmission(goals);
    expect(result.isValid).toBe(false);
  });

  it("fails with zero goals", () => {
    const result = validateSubmission([]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("at least 1"))).toBe(true);
  });

  it("passes with valid goals", () => {
    const result = validateSubmission([
      { title: "Goal A", weightage: 60 },
      { title: "Goal B", weightage: 40 },
    ]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("validateWeightage", () => {
  it("reports remaining weightage", () => {
    const result = validateWeightage([
      { title: "A", weightage: 40 },
      { title: "B", weightage: 30 },
    ]);
    expect(result.totalWeightage).toBe(70);
    expect(result.remaining).toBe(30);
  });
});
