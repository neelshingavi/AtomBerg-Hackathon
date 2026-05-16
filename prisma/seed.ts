import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REMOVED_DEMO_EMAILS = ["emp2@demo.com", "emp3@demo.com", "emp4@demo.com"];

async function main() {
  console.log("🌱 Seeding database...");

  const [engineering, hr, finance, ops] = await Promise.all([
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

  const removedUsers = await prisma.user.findMany({
    where: { email: { in: REMOVED_DEMO_EMAILS } },
    select: { id: true },
  });
  if (removedUsers.length > 0) {
    const removedIds = removedUsers.map((u) => u.id);
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { createdById: { in: removedIds } },
          { affectedUserId: { in: removedIds } },
        ],
      },
    });
    await prisma.notification.deleteMany({ where: { userId: { in: removedIds } } });
    await prisma.escalationLog.deleteMany({
      where: {
        OR: [
          { employeeId: { in: removedIds } },
          { managerId: { in: removedIds } },
        ],
      },
    });
    await prisma.checkinComment.deleteMany({ where: { managerId: { in: removedIds } } });
    await prisma.goalSheet.deleteMany({
      where: {
        OR: [
          { employeeId: { in: removedIds } },
          { managerId: { in: removedIds } },
          { lockedBy: { in: removedIds } },
        ],
      },
    });
    await prisma.user.updateMany({
      where: { managerId: { in: removedIds } },
      data: { managerId: null },
    });
    await prisma.session.deleteMany({ where: { userId: { in: removedIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: removedIds } } });
    await prisma.user.deleteMany({ where: { id: { in: removedIds } } });
  }

  const [admin, admin2, admin3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: { role: "ADMIN", isActive: true },
      create: {
        email: "admin@demo.com",
        name: "Priya Mehta",
        employeeCode: "ADMIN001",
        passwordHash,
        role: "ADMIN",
        departmentId: hr.id,
        designation: "HR Director",
      },
    }),
    prisma.user.upsert({
      where: { email: "admin2@demo.com" },
      update: { role: "ADMIN", isActive: true },
      create: {
        email: "admin2@demo.com",
        name: "Vikram Singh",
        employeeCode: "ADMIN002",
        passwordHash,
        role: "ADMIN",
        departmentId: hr.id,
        designation: "HR Operations Lead",
      },
    }),
    prisma.user.upsert({
      where: { email: "admin3@demo.com" },
      update: { role: "ADMIN", isActive: true },
      create: {
        email: "admin3@demo.com",
        name: "Kavita Nair",
        employeeCode: "ADMIN003",
        passwordHash,
        role: "ADMIN",
        departmentId: ops.id,
        designation: "People Operations Manager",
      },
    }),
  ]);

  const [manager, manager2, manager3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "manager@demo.com" },
      update: { role: "MANAGER", isActive: true, managerId: admin.id },
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
    }),
    prisma.user.upsert({
      where: { email: "manager2@demo.com" },
      update: { role: "MANAGER", isActive: true, managerId: admin2.id },
      create: {
        email: "manager2@demo.com",
        name: "Deepa Joshi",
        employeeCode: "MGR002",
        passwordHash,
        role: "MANAGER",
        departmentId: ops.id,
        managerId: admin2.id,
        designation: "Operations Manager",
      },
    }),
    prisma.user.upsert({
      where: { email: "manager3@demo.com" },
      update: { role: "MANAGER", isActive: true, managerId: admin3.id },
      create: {
        email: "manager3@demo.com",
        name: "Karan Desai",
        employeeCode: "MGR003",
        passwordHash,
        role: "MANAGER",
        departmentId: finance.id,
        managerId: admin3.id,
        designation: "Finance Manager",
      },
    }),
  ]);

  const [employee, employee2, employee3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "employee@demo.com" },
      update: { role: "EMPLOYEE", isActive: true, managerId: manager.id },
      create: {
        email: "employee@demo.com",
        name: "Riya Sharma",
        employeeCode: "EMP001",
        passwordHash,
        role: "EMPLOYEE",
        departmentId: engineering.id,
        managerId: manager.id,
        designation: "Senior Software Engineer",
      },
    }),
    prisma.user.upsert({
      where: { email: "employee2@demo.com" },
      update: { role: "EMPLOYEE", isActive: true, managerId: manager.id },
      create: {
        email: "employee2@demo.com",
        name: "Rohan Verma",
        employeeCode: "EMP002",
        passwordHash,
        role: "EMPLOYEE",
        departmentId: engineering.id,
        managerId: manager.id,
        designation: "Software Engineer",
      },
    }),
    prisma.user.upsert({
      where: { email: "employee3@demo.com" },
      update: { role: "EMPLOYEE", isActive: true, managerId: manager.id },
      create: {
        email: "employee3@demo.com",
        name: "Sneha Iyer",
        employeeCode: "EMP003",
        passwordHash,
        role: "EMPLOYEE",
        departmentId: engineering.id,
        managerId: manager.id,
        designation: "Software Engineer",
      },
    }),
  ]);

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

  await prisma.goalSheet.deleteMany({
    where: {
      id: {
        in: ["sheet-emp042-fy2526", "sheet-emp043-submitted", "sheet-emp044-draft"],
      },
    },
  });

  const goalSheet = await prisma.goalSheet.upsert({
    where: {
      employeeId_cycleId: { employeeId: employee.id, cycleId: cycle.id },
    },
    update: {
      status: "APPROVED",
      isLocked: true,
      managerId: manager.id,
    },
    create: {
      id: "sheet-emp001-fy2526",
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

  const employeeGoals = [
    {
      id: "goal-1",
      thrustAreaId: "ta-business-growth",
      title: "Increase Regional Sales Revenue",
      description:
        "Drive revenue growth in North and West zones through enterprise accounts",
      uomType: "NUMERIC_MIN" as const,
      plannedTarget: 50,
      unit: "₹ Crores",
      weightage: 30,
      order: 1,
    },
    {
      id: "goal-2",
      thrustAreaId: "ta-efficiency",
      title: "Reduce Average Order TAT",
      description: "Streamline order processing to under 3 business days",
      uomType: "NUMERIC_MAX" as const,
      plannedTarget: 3,
      unit: "Days",
      weightage: 20,
      order: 2,
    },
    {
      id: "goal-3",
      thrustAreaId: "ta-quality",
      title: "Achieve Zero Critical Production Incidents",
      uomType: "ZERO_BASED" as const,
      plannedTarget: 0,
      unit: "P0 Incidents",
      weightage: 20,
      order: 3,
    },
    {
      id: "goal-4",
      thrustAreaId: "ta-people",
      title: "Complete Leadership Development Program",
      uomType: "TIMELINE" as const,
      plannedTarget: 1,
      unit: "Certification",
      targetDeadline: new Date("2025-12-31"),
      weightage: 15,
      order: 4,
    },
    {
      id: "goal-5",
      thrustAreaId: "ta-innovation",
      title: "Launch AI-powered Customer Support Module",
      description: "Deliver MVP and achieve 80% CSAT in pilot",
      uomType: "PERCENTAGE_MIN" as const,
      plannedTarget: 80,
      unit: "% CSAT",
      weightage: 15,
      order: 5,
    },
  ];

  for (const g of employeeGoals) {
    await prisma.goal.upsert({
      where: { id: g.id },
      update: {},
      create: { ...g, goalSheetId: goalSheet.id },
    });
  }

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
      remark:
        "Strong start in North zone. West zone deal pipeline looks promising.",
    },
  });

  const employee2Sheet = await prisma.goalSheet.upsert({
    where: { employeeId_cycleId: { employeeId: employee2.id, cycleId: cycle.id } },
    update: { status: "SUBMITTED", managerId: manager.id },
    create: {
      id: "sheet-emp002-submitted",
      status: "SUBMITTED",
      submittedAt: new Date("2025-05-14T10:00:00Z"),
      employeeId: employee2.id,
      managerId: manager.id,
      cycleId: cycle.id,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp002-1" },
    update: {},
    create: {
      id: "goal-emp002-1",
      goalSheetId: employee2Sheet.id,
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
    where: { id: "goal-emp002-2" },
    update: {},
    create: {
      id: "goal-emp002-2",
      goalSheetId: employee2Sheet.id,
      thrustAreaId: "ta-efficiency",
      title: "Reduce Bug Backlog",
      uomType: "NUMERIC_MAX",
      plannedTarget: 50,
      unit: "Open bugs",
      weightage: 50,
      order: 2,
    },
  });

  const employee3Sheet = await prisma.goalSheet.upsert({
    where: { employeeId_cycleId: { employeeId: employee3.id, cycleId: cycle.id } },
    update: {
      status: "DRAFT",
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      isLocked: false,
      lockedAt: null,
      managerId: manager.id,
    },
    create: {
      id: "sheet-employee3-draft",
      status: "DRAFT",
      employeeId: employee3.id,
      managerId: manager.id,
      cycleId: cycle.id,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-emp003-1" },
    update: {},
    create: {
      id: "goal-emp003-1",
      goalSheetId: employee3Sheet.id,
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
    where: { id: "goal-emp003-2" },
    update: {},
    create: {
      id: "goal-emp003-2",
      goalSheetId: employee3Sheet.id,
      thrustAreaId: "ta-efficiency",
      title: "Reduce Support TAT",
      uomType: "NUMERIC_MAX",
      plannedTarget: 3,
      unit: "Days",
      weightage: 40,
      order: 2,
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
  console.log("📋 Demo Credentials (password: password123)");
  console.log("");
  console.log("  Admins (3):");
  console.log("    admin@demo.com   admin2@demo.com   admin3@demo.com");
  console.log("  Managers (3):");
  console.log("    manager@demo.com   manager2@demo.com   manager3@demo.com");
  console.log("  Employees (3):");
  console.log("    employee@demo.com   employee2@demo.com   employee3@demo.com");
  console.log("");
  console.log("  Goal sheet states:");
  console.log("    employee@demo.com  — APPROVED (locked), Q1 check-in");
  console.log("    employee2@demo.com — SUBMITTED (manager approval queue)");
  console.log("    employee3@demo.com — DRAFT (60/40 weightage, submit demo)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
