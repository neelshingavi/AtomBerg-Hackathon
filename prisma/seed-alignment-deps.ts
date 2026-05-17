import type { PrismaClient } from "@prisma/client";

/** Seeds goal-to-goal dependencies for alignment graph demos */
export async function seedGoalDependencies(prisma: PrismaClient, cycleId: string) {
  const goals = await prisma.goal.findMany({
    where: { goalSheet: { cycleId, status: "APPROVED" } },
    select: {
      id: true,
      title: true,
      sharedGoalId: true,
      thrustAreaId: true,
      goalSheet: { select: { employee: { select: { departmentId: true } } } },
    },
    take: 120,
  });

  if (goals.length < 4) return;

  const byShared = new Map<string, typeof goals>();
  for (const g of goals) {
    if (!g.sharedGoalId) continue;
    const list = byShared.get(g.sharedGoalId) ?? [];
    list.push(g);
    byShared.set(g.sharedGoalId, list);
  }

  let created = 0;
  const existing = await prisma.goalDependency.count({ where: { cycleId } });
  if (existing >= 5) {
    console.log("  Goal dependencies already seeded");
    return;
  }

  for (const [, group] of Array.from(byShared.entries())) {
    if (group.length < 2) continue;
    const [upstream, downstream] = group;
    await prisma.goalDependency.upsert({
      where: {
        fromGoalId_toGoalId_type: {
          fromGoalId: upstream.id,
          toGoalId: downstream.id,
          type: "CONTRIBUTES_TO",
        },
      },
      update: {},
      create: {
        fromGoalId: upstream.id,
        toGoalId: downstream.id,
        type: "CONTRIBUTES_TO",
        cycleId,
        description: "Cross-team contribution to shared initiative",
      },
    });
    created++;
  }

  const sharedGoals = await prisma.sharedGoal.findMany({
    where: { cycleId, isActive: true },
    take: 4,
  });

  for (let i = 0; i < sharedGoals.length - 1; i++) {
    const sgGoals = goals.filter((g) => g.sharedGoalId === sharedGoals[i].id);
    const nextSgGoals = goals.filter((g) => g.sharedGoalId === sharedGoals[i + 1]?.id);
    if (sgGoals[0] && nextSgGoals[0]) {
      await prisma.goalDependency.upsert({
        where: {
          fromGoalId_toGoalId_type: {
            fromGoalId: sgGoals[0].id,
            toGoalId: nextSgGoals[0].id,
            type: "DEPENDS_ON",
          },
        },
        update: { isCritical: i === 0 },
        create: {
          fromGoalId: sgGoals[0].id,
          toGoalId: nextSgGoals[0].id,
          type: "DEPENDS_ON",
          cycleId,
          isCritical: i === 0,
          description: "Strategic initiative dependency chain",
        },
      });
      created++;
    }
  }

  const atRisk = goals.filter((g) => g.title.toLowerCase().includes("reduce") || g.title.toLowerCase().includes("cost"));
  const blocked = goals.filter((g) => g.title.toLowerCase().includes("launch") || g.title.toLowerCase().includes("platform"));
  if (atRisk[0] && blocked[0]) {
    await prisma.goalDependency.upsert({
      where: {
        fromGoalId_toGoalId_type: {
          fromGoalId: blocked[0].id,
          toGoalId: atRisk[0].id,
          type: "BLOCKED_BY",
        },
      },
      update: { isCritical: true },
      create: {
        fromGoalId: blocked[0].id,
        toGoalId: atRisk[0].id,
        type: "BLOCKED_BY",
        cycleId,
        isCritical: true,
        description: "Blocked execution path — critical path",
      },
    });
    created++;
  }

  const crossDept = goals.filter((g, i, arr) => {
    const dept = g.goalSheet.employee.departmentId;
    return arr.some((o, j) => j !== i && o.goalSheet.employee.departmentId !== dept && o.thrustAreaId === g.thrustAreaId);
  });
  if (crossDept.length >= 2) {
    await prisma.goalDependency.upsert({
      where: {
        fromGoalId_toGoalId_type: {
          fromGoalId: crossDept[0].id,
          toGoalId: crossDept[1].id,
          type: "CROSS_TEAM",
        },
      },
      update: {},
      create: {
        fromGoalId: crossDept[0].id,
        toGoalId: crossDept[1].id,
        type: "CROSS_TEAM",
        cycleId,
        description: "Cross-functional team dependency",
      },
    });
    created++;
  }

  console.log(`  Seeded ${created} goal dependencies for alignment graph`);
}
