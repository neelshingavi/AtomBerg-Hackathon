/**
 * Run: npx tsx scripts/verify-seed.ts
 * Confirms demo seed data is present for hackathon demos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAILS = {
  ADMIN: ["admin@demo.com", "admin2@demo.com", "admin3@demo.com"],
  MANAGER: ["manager@demo.com", "manager2@demo.com", "manager3@demo.com"],
  EMPLOYEE: ["employee@demo.com", "employee2@demo.com", "employee3@demo.com"],
};

const ALL_DEMO_EMAILS = [
  ...DEMO_EMAILS.ADMIN,
  ...DEMO_EMAILS.MANAGER,
  ...DEMO_EMAILS.EMPLOYEE,
];

const REMOVED_EMAILS = ["emp2@demo.com", "emp3@demo.com", "emp4@demo.com"];

async function main() {
  console.log("Seed verification\n");

  let ok = true;

  const users = await prisma.user.findMany({
    where: { email: { in: [...ALL_DEMO_EMAILS, ...REMOVED_EMAILS] } },
    select: { email: true, role: true, isActive: true },
  });

  for (const email of ALL_DEMO_EMAILS) {
    const u = users.find((x) => x.email === email);
    if (!u?.isActive) {
      console.error(`  ✗ Missing or inactive: ${email}`);
      ok = false;
    } else {
      console.log(`  ✓ ${email} (${u.role})`);
    }
  }

  for (const email of REMOVED_EMAILS) {
    if (users.some((x) => x.email === email)) {
      console.error(`  ✗ Legacy account still present: ${email}`);
      ok = false;
    }
  }

  for (const [role, emails] of Object.entries(DEMO_EMAILS)) {
    const count = users.filter((u) => emails.includes(u.email) && u.role === role).length;
    if (count !== 3) {
      console.error(`  ✗ Expected 3 ${role} users, found ${count}`);
      ok = false;
    }
  }

  const activeCycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) {
    console.error("  ✗ No active goal cycle");
    ok = false;
  } else {
    console.log(`  ✓ Active cycle: ${activeCycle.name}`);
  }

  const approvedSheet = await prisma.goalSheet.findFirst({
    where: {
      status: "APPROVED",
      employee: { email: "employee@demo.com" },
    },
    include: { goals: true },
  });

  if (!approvedSheet) {
    console.error("  ✗ No approved sheet for employee@demo.com");
    ok = false;
  } else {
    console.log(
      `  ✓ Employee approved sheet (${approvedSheet.goals.length} goals, locked=${approvedSheet.isLocked})`
    );
  }

  const submitted = await prisma.goalSheet.findFirst({
    where: { status: "SUBMITTED", employee: { email: "employee2@demo.com" } },
  });
  if (!submitted) {
    console.error("  ✗ No submitted sheet for employee2@demo.com");
    ok = false;
  } else {
    console.log("  ✓ employee2@demo.com submitted sheet (pending approval)");
  }

  const draft = await prisma.goalSheet.findFirst({
    where: { status: "DRAFT", employee: { email: "employee3@demo.com" } },
    include: { goals: true },
  });
  if (!draft || draft.goals.length !== 2) {
    console.error("  ✗ employee3@demo.com draft sheet missing or incomplete");
    ok = false;
  } else {
    console.log("  ✓ employee3@demo.com draft sheet (2 goals)");
  }

  const rules = await prisma.escalationRule.count({ where: { isActive: true } });
  console.log(`  ✓ Active escalation rules: ${rules}`);

  const thrustAreas = await prisma.thrustArea.count({ where: { isActive: true } });
  console.log(`  ✓ Active thrust areas: ${thrustAreas}`);

  console.log(ok ? "\nSeed OK" : "\nSeed verification FAILED");
  process.exit(ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
