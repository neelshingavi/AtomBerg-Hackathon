import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const [engineering, hr] = await Promise.all([
    prisma.department.upsert({
      where: { code: "ENG" },
      update: {},
      create: { name: "Engineering", code: "ENG" },
    }),
    prisma.department.upsert({
      where: { code: "HR" },
      update: {},
      create: { name: "Human Resources", code: "HR" },
    }),
    prisma.department.upsert({
      where: { code: "FIN" },
      update: {},
      create: { name: "Finance", code: "FIN" },
    }),
    prisma.department.upsert({
      where: { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS" },
    }),
  ]);

  await Promise.all([
    prisma.thrustArea.upsert({
      where: { id: "ta-business-growth" },
      update: {},
      create: {
        id: "ta-business-growth",
        name: "Business Growth",
        color: "#10b981",
        order: 1,
      },
    }),
    prisma.thrustArea.upsert({
      where: { id: "ta-efficiency" },
      update: {},
      create: {
        id: "ta-efficiency",
        name: "Operational Efficiency",
        color: "#6366f1",
        order: 2,
      },
    }),
    prisma.thrustArea.upsert({
      where: { id: "ta-quality" },
      update: {},
      create: {
        id: "ta-quality",
        name: "Quality & Compliance",
        color: "#f59e0b",
        order: 3,
      },
    }),
    prisma.thrustArea.upsert({
      where: { id: "ta-people" },
      update: {},
      create: {
        id: "ta-people",
        name: "People & Culture",
        color: "#ec4899",
        order: 4,
      },
    }),
    prisma.thrustArea.upsert({
      where: { id: "ta-innovation" },
      update: {},
      create: {
        id: "ta-innovation",
        name: "Innovation",
        color: "#8b5cf6",
        order: 5,
      },
    }),
  ]);

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Priya Mehta",
      employeeCode: "ADMIN001",
      passwordHash,
      role: "ADMIN",
      departmentId: hr.id,
      designation: "HR Director",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      email: "manager@demo.com",
      name: "Amit Patel",
      employeeCode: "MGR001",
      passwordHash,
      role: "MANAGER",
      departmentId: engineering.id,
      managerId: admin.id,
      designation: "Engineering Manager",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@demo.com" },
    update: {},
    create: {
      email: "employee@demo.com",
      name: "Riya Sharma",
      employeeCode: "EMP042",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager.id,
      designation: "Senior Software Engineer",
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: "emp2@demo.com" },
    update: {},
    create: {
      email: "emp2@demo.com",
      name: "Rohan Verma",
      employeeCode: "EMP043",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager.id,
      designation: "Software Engineer",
    },
  });

  const cycle = await prisma.goalCycle.upsert({
    where: { id: "cycle-fy2526" },
    update: {
      currentPhase: "Q1_CHECKIN",
      goalSettingStart: new Date("2025-04-01"),
      goalSettingEnd: new Date("2027-04-30"),
      q1WindowStart: new Date("2026-05-01"),
      q1WindowEnd: new Date("2026-05-31"),
    },
    create: {
      id: "cycle-fy2526",
      name: "FY 2025-26",
      fiscalYear: "2025-26",
      isActive: true,
      currentPhase: "Q1_CHECKIN",
      goalSettingStart: new Date("2026-04-01"),
      goalSettingEnd: new Date("2026-06-30"),
      q1WindowStart: new Date("2026-05-01"),
      q1WindowEnd: new Date("2026-05-31"),
      q2WindowStart: new Date("2026-10-01"),
      q2WindowEnd: new Date("2026-10-31"),
      q3WindowStart: new Date("2027-01-01"),
      q3WindowEnd: new Date("2027-01-31"),
      q4WindowStart: new Date("2027-03-01"),
      q4WindowEnd: new Date("2027-04-30"),
    },
  });

  const goalSheet = await prisma.goalSheet.upsert({
    where: { id: "sheet-emp042-fy2526" },
    update: {},
    create: {
      id: "sheet-emp042-fy2526",
      status: "APPROVED",
      isLocked: true,
      lockedAt: new Date("2025-05-15"),
      lockedBy: manager.id,
      approvedAt: new Date("2025-05-15"),
      submittedAt: new Date("2025-05-12"),
      employeeId: employee.id,
      managerId: manager.id,
      cycleId: cycle.id,
      managerNote: "Strong goals. Focus on Q1 revenue push.",
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-1" },
    update: {},
    create: {
      id: "goal-1",
      goalSheetId: goalSheet.id,
      thrustAreaId: "ta-business-growth",
      title: "Increase Regional Sales Revenue",
      description: "Drive revenue growth in North and West zones through enterprise accounts",
      uomType: "NUMERIC_MIN",
      plannedTarget: 50,
      unit: "₹ Crores",
      weightage: 30,
      order: 1,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-2" },
    update: {},
    create: {
      id: "goal-2",
      goalSheetId: goalSheet.id,
      thrustAreaId: "ta-efficiency",
      title: "Reduce Average Order TAT",
      description: "Streamline order processing to under 3 business days",
      uomType: "NUMERIC_MAX",
      plannedTarget: 3,
      unit: "Days",
      weightage: 20,
      order: 2,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-3" },
    update: {},
    create: {
      id: "goal-3",
      goalSheetId: goalSheet.id,
      thrustAreaId: "ta-quality",
      title: "Achieve Zero Critical Production Incidents",
      uomType: "ZERO_BASED",
      plannedTarget: 0,
      unit: "P0 Incidents",
      weightage: 20,
      order: 3,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-4" },
    update: {},
    create: {
      id: "goal-4",
      goalSheetId: goalSheet.id,
      thrustAreaId: "ta-people",
      title: "Complete Leadership Development Program",
      uomType: "TIMELINE",
      plannedTarget: 1,
      unit: "Certification",
      targetDeadline: new Date("2025-12-31"),
      weightage: 15,
      order: 4,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-5" },
    update: {},
    create: {
      id: "goal-5",
      goalSheetId: goalSheet.id,
      thrustAreaId: "ta-innovation",
      title: "Launch AI-powered Customer Support Module",
      description: "Deliver MVP and achieve 80% CSAT in pilot",
      uomType: "PERCENTAGE_MIN",
      plannedTarget: 80,
      unit: "% CSAT",
      weightage: 15,
      order: 5,
    },
  });

  await prisma.achievement.upsert({
    where: { goalId_quarter: { goalId: "goal-1", quarter: "Q1" } },
    update: {},
    create: {
      goalId: "goal-1",
      quarter: "Q1",
      cycleId: cycle.id,
      actualValue: 12.5,
      status: "ON_TRACK",
      progressScore: 12.5 / 50,
      remark: "Strong start in North zone. West zone deal pipeline looks promising.",
    },
  });

  await prisma.escalationRule.upsert({
    where: { id: "esc-rule-1" },
    update: {},
    create: {
      id: "esc-rule-1",
      trigger: "GOAL_NOT_SUBMITTED",
      daysThreshold: 7,
      notifyEmployee: true,
      notifyManager: true,
      notifyHR: false,
    },
  });

  await prisma.escalationRule.upsert({
    where: { id: "esc-rule-2" },
    update: {},
    create: {
      id: "esc-rule-2",
      trigger: "GOAL_NOT_APPROVED",
      daysThreshold: 5,
      notifyEmployee: false,
      notifyManager: true,
      notifyHR: true,
    },
  });

  const emp3 = await prisma.user.upsert({
    where: { email: "emp3@demo.com" },
    update: {},
    create: {
      email: "emp3@demo.com",
      name: "Sneha Iyer",
      employeeCode: "EMP044",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager.id,
      designation: "Software Engineer",
    },
  });

  const emp3Sheet = await prisma.goalSheet.upsert({
    where: { employeeId_cycleId: { employeeId: emp3.id, cycleId: cycle.id } },
    update: {
      status: "DRAFT",
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      isLocked: false,
      lockedAt: null,
    },
    create: {
      id: "sheet-emp044-draft",
      status: "DRAFT",
      employeeId: emp3.id,
      managerId: manager.id,
      cycleId: cycle.id,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp3-1" },
    update: {},
    create: {
      id: "goal-emp3-1",
      goalSheetId: emp3Sheet.id,
      thrustAreaId: "ta-business-growth",
      title: "Increase Q3 Revenue",
      uomType: "NUMERIC_MIN",
      plannedTarget: 50,
      unit: "₹ Crores",
      weightage: 60,
      order: 1,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp3-2" },
    update: {},
    create: {
      id: "goal-emp3-2",
      goalSheetId: emp3Sheet.id,
      thrustAreaId: "ta-efficiency",
      title: "Reduce Support TAT",
      uomType: "NUMERIC_MAX",
      plannedTarget: 3,
      unit: "Days",
      weightage: 40,
      order: 2,
    },
  });

  // E2E / demo: employee with no sheet yet (full create → submit journey)
  await prisma.user.upsert({
    where: { email: "emp4@demo.com" },
    update: {},
    create: {
      email: "emp4@demo.com",
      name: "Arjun Mehta",
      employeeCode: "EMP045",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: engineering.id,
      managerId: manager.id,
      designation: "Software Engineer",
    },
  });

  const emp2Submitted = await prisma.goalSheet.upsert({
    where: { employeeId_cycleId: { employeeId: emp2.id, cycleId: cycle.id } },
    update: {},
    create: {
      id: "sheet-emp043-submitted",
      status: "SUBMITTED",
      submittedAt: new Date("2025-05-14T10:00:00Z"),
      employeeId: emp2.id,
      managerId: manager.id,
      cycleId: cycle.id,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp2-1" },
    update: {},
    create: {
      id: "goal-emp2-1",
      goalSheetId: emp2Submitted.id,
      thrustAreaId: "ta-business-growth",
      title: "Grow Partner Channel Revenue",
      uomType: "NUMERIC_MIN",
      plannedTarget: 20,
      unit: "₹ Crores",
      weightage: 50,
      order: 1,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp2-2" },
    update: {},
    create: {
      id: "goal-emp2-2",
      goalSheetId: emp2Submitted.id,
      thrustAreaId: "ta-efficiency",
      title: "Reduce Bug Backlog",
      uomType: "NUMERIC_MAX",
      plannedTarget: 50,
      unit: "Open bugs",
      weightage: 50,
      order: 2,
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "active_cycle_id" },
    update: { value: cycle.id },
    create: {
      key: "active_cycle_id",
      value: cycle.id,
      description: "The currently active goal cycle ID",
    },
  });

  console.log("✅ Seed completed!");
  console.log("");
  console.log("📋 Demo Credentials:");
  console.log("  Employee : employee@demo.com / password123");
  console.log("  Manager  : manager@demo.com  / password123");
  console.log("  Admin    : admin@demo.com    / password123");
  console.log("  E2E      : emp4@demo.com     / password123 (no goal sheet — create flow)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
