/**
 * Run: npx tsx scripts/verify-seed.ts
 * Confirms demo seed data is present for hackathon demos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  "employee@demo.com",
  "manager@demo.com",
  "admin@demo.com",
  "emp2@demo.com",
  "emp3@demo.com",
  "emp4@demo.com",
];

async function main() {
  console.log("Seed verification\n");

  let ok = true;

  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { email: true, role: true, isActive: true },
  });

  for (const email of DEMO_EMAILS) {
    const u = users.find((x) => x.email === email);
    if (!u?.isActive) {
      console.error(`  ✗ Missing or inactive: ${email}`);
      ok = false;
    } else {
      console.log(`  ✓ ${email} (${u.role})`);
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

  const submitted = await prisma.goalSheet.count({ where: { status: "SUBMITTED" } });
  console.log(`  ✓ Submitted sheets pending approval: ${submitted}`);

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
