/**
 * Run after main seed: npx tsx prisma/seed-realtime.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.log("No admin user — skip realtime seed");
    return;
  }

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } });

  const spaces = [
    {
      name: "Operational Excellence Initiative",
      slug: "operational-excellence",
      description: "Cross-functional execution velocity and approval modernization.",
      color: "#6366f1",
    },
    {
      name: "Workforce Modernization",
      slug: "workforce-modernization",
      description: "Goal-setting transformation and manager enablement.",
      color: "#10b981",
    },
    {
      name: "Q3 Efficiency Push",
      slug: "q3-efficiency-push",
      description: "Strategic initiative tracking for quarter-end delivery.",
      color: "#f59e0b",
    },
  ];

  for (const s of spaces) {
    await prisma.collaborationSpace.upsert({
      where: { slug: s.slug },
      create: {
        ...s,
        ownerId: admin.id,
        cycleId: cycle?.id,
        members: { create: { userId: admin.id, role: "owner" } },
        posts: {
          create: {
            authorId: admin.id,
            body: `Kickoff for ${s.name} — tracking blockers and decisions in this room.`,
            postType: "UPDATE",
          },
        },
      },
      update: {},
    });
  }

  await prisma.operationalAlert.createMany({
    data: [
      {
        alertType: "approval_bottleneck",
        title: "Finance approval queue elevated",
        message:
          "Rising approval delays may impact quarterly execution targets and strategic initiative timelines.",
        severity: "HIGH",
        recommendation: "Review Finance manager workload and enable bulk approvals.",
        cycleId: cycle?.id,
      },
      {
        alertType: "escalation_spike",
        title: "Operations escalation growth",
        message: "Escalation volume increased this week — emerging execution bottlenecks require leadership intervention.",
        severity: "CRITICAL",
        recommendation: "Open incident response and inspect dependency chains in alignment graph.",
        cycleId: cycle?.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.operationalEvent.createMany({
    data: [
      {
        type: "AI_INSIGHT",
        title: "AI: Engineering shows strongest execution consistency",
        description: "Predictive engine detected stable approval velocity in Engineering.",
        severity: "low",
        actorId: admin.id,
        cycleId: cycle?.id,
      },
      {
        type: "COLLABORATION",
        title: "Shared goal collaboration improving alignment",
        description: "Cross-functional participation increased across initiative spaces.",
        severity: "low",
        cycleId: cycle?.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Realtime seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
