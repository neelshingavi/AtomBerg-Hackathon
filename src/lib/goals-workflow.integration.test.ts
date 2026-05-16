/**
 * API / DB integration tests (§16.2) — requires DATABASE_URL and seeded demo data.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { validateSubmission } from "@/lib/calculations/weightage";
import { getCurrentPhase } from "@/lib/cycle";

const prisma = new PrismaClient();

describe("Goal workflow integration", () => {
  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: "employee@demo.com" } });
    if (!user) {
      throw new Error("Run npm run db:seed before integration tests");
    }
  });

  it("active cycle is in goal-setting or check-in phase", async () => {
    const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
    expect(cycle).toBeTruthy();
    const phase = getCurrentPhase(cycle!);
    expect(["GOAL_SETTING", "Q1_CHECKIN", "Q2_CHECKIN", "Q3_CHECKIN", "Q4_ANNUAL"]).toContain(
      phase
    );
  });

  it("employee has an approved locked sheet with goals", async () => {
    const sheet = await prisma.goalSheet.findFirst({
      where: {
        status: "APPROVED",
        isLocked: true,
        employee: { email: "employee@demo.com" },
      },
      include: { goals: true },
    });
    expect(sheet).toBeTruthy();
    expect(sheet!.goals.length).toBeGreaterThan(0);
    const total = sheet!.goals.reduce((s, g) => s + g.weightage, 0);
    expect(total).toBe(100);
  });

  it("employee3 sheet has two goals totaling 100% weightage (seed)", async () => {
    const sheet = await prisma.goalSheet.findFirst({
      where: { employee: { email: "employee3@demo.com" } },
      include: { goals: true },
    });
    expect(sheet).toBeTruthy();
    expect(sheet!.goals.length).toBe(2);
    const total = sheet!.goals.reduce((s, g) => s + g.weightage, 0);
    expect(total).toBe(100);
    if (sheet!.status === "DRAFT") {
      const check = validateSubmission(
        sheet!.goals.map((g) => ({ title: g.title, weightage: g.weightage }))
      );
      expect(check.isValid).toBe(true);
    }
  });

  it("submitted sheet exists for manager approval queue", async () => {
    const count = await prisma.goalSheet.count({ where: { status: "SUBMITTED" } });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("escalation rules are seeded", async () => {
    const count = await prisma.escalationRule.count({ where: { isActive: true } });
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
