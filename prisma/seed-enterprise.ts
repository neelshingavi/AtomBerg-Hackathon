import type { PrismaClient } from "@prisma/client";
import type { GoalStatus, CheckinStatus, EscalationStatus, UoMType } from "@prisma/client";

const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Karan", "Meera",
  "Arjun", "Kavya", "Rahul", "Divya", "Sanjay", "Neha", "Aditya", "Pooja",
  "Nikhil", "Isha", "Manish", "Ritu", "Suresh", "Lakshmi", "Gaurav", "Anjali",
];
const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Iyer", "Singh", "Gupta", "Reddy", "Nair",
  "Desai", "Joshi", "Mehta", "Kumar", "Rao", "Pillai", "Shah", "Malhotra",
];

const THRUST_IDS = [
  "ta-business-growth",
  "ta-efficiency",
  "ta-quality",
  "ta-people",
  "ta-innovation",
];

const UOM_TYPES: UoMType[] = [
  "NUMERIC_MIN",
  "NUMERIC_MAX",
  "PERCENTAGE_MIN",
  "TIMELINE",
];

const STATUSES: GoalStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "APPROVED", "APPROVED"];
const CHECKIN_STATUSES: CheckinStatus[] = ["ON_TRACK", "ON_TRACK", "AT_RISK", "COMPLETED", "NOT_STARTED"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function seedEnterpriseData(
  prisma: PrismaClient,
  deps: {
    departments: { id: string; code: string }[];
    cycleId: string;
    passwordHash: string;
    managers: { id: string; departmentId: string }[];
  }
) {
  console.log("🏢 Seeding enterprise dataset (100+ employees)...");

  const existingCount = await prisma.user.count({ where: { role: "EMPLOYEE" } });
  if (existingCount >= 100) {
    console.log("  Skipping — already have 100+ employees");
    return;
  }

  const deptManagers = new Map<string, string[]>();
  for (const m of deps.managers) {
    const list = deptManagers.get(m.departmentId) ?? [];
    list.push(m.id);
    deptManagers.set(m.departmentId, list);
  }

  const employees: { id: string; departmentId: string; managerId: string }[] = [];
  const targetCount = 110;

  for (let i = 0; i < targetCount; i++) {
    const dept = pick(deps.departments, i);
    const mgrList = deptManagers.get(dept.id) ?? [deps.managers[0].id];
    const managerId = pick(mgrList, i);
    const fn = pick(FIRST_NAMES, i);
    const ln = pick(LAST_NAMES, i + 7);
    const email = `emp${String(i + 10).padStart(3, "0")}@demo.com`;
    const code = `EMP${String(i + 10).padStart(3, "0")}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { isActive: true, managerId, departmentId: dept.id },
      create: {
        email,
        name: `${fn} ${ln}`,
        employeeCode: code,
        passwordHash: deps.passwordHash,
        role: "EMPLOYEE",
        departmentId: dept.id,
        managerId,
        designation: i % 5 === 0 ? "Senior Engineer" : "Associate",
        isActive: i % 17 !== 0,
      },
    });
    employees.push({ id: user.id, departmentId: dept.id, managerId });
  }

  const sharedGoals = await prisma.sharedGoal.findMany({
    where: { cycleId: deps.cycleId },
    take: 3,
  });

  let sheetCount = 0;
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const status = pick(STATUSES, i + Math.floor(seededRand(i) * 3));
    const isLocked = status === "APPROVED" && seededRand(i) > 0.3;
    const submittedAt =
      status !== "DRAFT"
        ? new Date(Date.now() - (5 + (i % 20)) * 24 * 60 * 60 * 1000)
        : null;
    const approvedAt =
      status === "APPROVED"
        ? new Date(Date.now() - (2 + (i % 10)) * 24 * 60 * 60 * 1000)
        : null;

    const sheet = await prisma.goalSheet.upsert({
      where: {
        employeeId_cycleId: { employeeId: emp.id, cycleId: deps.cycleId },
      },
      update: { status, isLocked, managerId: emp.managerId },
      create: {
        employeeId: emp.id,
        managerId: emp.managerId,
        cycleId: deps.cycleId,
        status,
        isLocked,
        submittedAt,
        approvedAt,
        lockedAt: isLocked ? approvedAt : null,
        lockedBy: isLocked ? emp.managerId : null,
      },
    });
    sheetCount++;

    const goalCount = 3 + (i % 3);
    for (let g = 0; g < goalCount; g++) {
      const thrustId = pick(THRUST_IDS, i + g);
      const useShared = sharedGoals.length > 0 && g === 0 && seededRand(i + g) > 0.6;
      const goal = await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          thrustAreaId: thrustId,
          title: `Goal ${g + 1}: ${pick(["Revenue", "Efficiency", "Quality", "Innovation"], i + g)} target`,
          uomType: pick(UOM_TYPES, i + g),
          plannedTarget: 50 + (i % 50),
          unit: "%",
          weightage: Math.round(100 / goalCount),
          order: g + 1,
          isShared: useShared,
          sharedGoalId: useShared ? sharedGoals[i % sharedGoals.length].id : null,
        },
      });

      for (const quarter of ["Q1", "Q2", "Q3", "Q4"].slice(0, 1 + (i % 4))) {
        if (status !== "APPROVED" && quarter !== "Q1") continue;
        const progress = seededRand(i + g) * 0.9 + 0.05;
        await prisma.achievement.upsert({
          where: { goalId_quarter: { goalId: goal.id, quarter } },
          update: {},
          create: {
            goalId: goal.id,
            quarter,
            cycleId: deps.cycleId,
            actualValue: progress * 50,
            status: pick(CHECKIN_STATUSES, i + g),
            progressScore: progress,
            remark: progress < 0.4 ? "Behind plan" : undefined,
          },
        });
      }
    }
  }

  const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });
  if (rules.length > 0) {
    const atRiskEmps = employees.filter((_, i) => i % 8 === 0).slice(0, 25);
    for (let i = 0; i < atRiskEmps.length; i++) {
      const emp = atRiskEmps[i];
      const rule = rules[i % rules.length];
      const statuses: EscalationStatus[] = ["PENDING", "NOTIFIED", "ESCALATED", "RESOLVED"];
      const status = pick(statuses, i);
      await prisma.escalationLog.create({
        data: {
          ruleId: rule.id,
          employeeId: emp.id,
          managerId: emp.managerId,
          status,
          resolvedAt: status === "RESOLVED" ? new Date() : null,
          createdAt: new Date(Date.now() - (3 + (i % 14)) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  if (sharedGoals.length === 0) {
    for (const thrustId of THRUST_IDS.slice(0, 2)) {
      await prisma.sharedGoal.create({
        data: {
          title: `Company priority: ${thrustId.replace("ta-", "").replace(/-/g, " ")}`,
          thrustAreaId: thrustId,
          uomType: "PERCENTAGE_MIN",
          plannedTarget: 100,
          unit: "%",
          pushedById: deps.managers[0].id,
          cycleId: deps.cycleId,
          isActive: true,
        },
      });
    }
  }

  const goals = await prisma.goal.findMany({
    where: { goalSheet: { cycleId: deps.cycleId } },
    take: 30,
    select: { id: true },
  });
  for (let i = 0; i < Math.min(20, goals.length - 1); i++) {
    try {
      await prisma.goalDependency.create({
        data: {
          fromGoalId: goals[i].id,
          toGoalId: goals[i + 1].id,
          type: ["DEPENDS_ON", "CONTRIBUTES_TO", "CROSS_TEAM"][i % 3] as "DEPENDS_ON",
          cycleId: deps.cycleId,
          isCritical: i % 4 === 0,
        },
      });
    } catch {
      // unique constraint
    }
  }

  console.log(`  ✓ ${employees.length} employees, ${sheetCount} goal sheets, escalations seeded`);
}
