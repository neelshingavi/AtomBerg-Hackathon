import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { getCurrentPhase, getActiveCycle } from "@/lib/cycle";
import { createNotification } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeCycle = await getActiveCycle();
  const phaseUpdates: string[] = [];

  if (activeCycle) {
    const computed = getCurrentPhase(activeCycle);
    if (activeCycle.currentPhase !== computed) {
      await prisma.goalCycle.update({
        where: { id: activeCycle.id },
        data: { currentPhase: computed },
      });
      phaseUpdates.push(`${activeCycle.name}: ${activeCycle.currentPhase} → ${computed}`);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startingToday = await prisma.goalCycle.findMany({
    where: {
      goalSettingStart: { gte: today, lt: tomorrow },
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  for (const cycle of startingToday) {
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "CYCLE_STARTED",
        title: `Goal setting opened: ${cycle.name}`,
        message: `The goal setting window for ${cycle.fiscalYear} is now open.`,
        link: "/admin/cycles",
        metadata: { cycleId: cycle.id },
      });
    }
  }

  return NextResponse.json({
    success: true,
    phaseUpdates,
    cyclesStartingToday: startingToday.map((c) => c.name),
  });
}
