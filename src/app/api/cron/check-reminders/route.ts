import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { createNotification } from "@/lib/goals";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { sendCheckInReminderEmail } from "@/lib/email/resend";
import { trackJobRun } from "@/lib/observability/tracker";
import { bumpRealtimeVersion } from "@/lib/realtime/events";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ success: true, message: "No active cycle" });
  }

  const activeQuarter = getActiveQuarter(activeCycle);
  if (!activeQuarter) {
    return NextResponse.json({
      success: true,
      message: "No active check-in window",
    });
  }

  const sheets = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle.id,
      status: "APPROVED",
      isLocked: true,
    },
    include: {
      employee: true,
      goals: {
        include: {
          achievements: {
            where: {
              quarter: activeQuarter,
              actualValue: { not: null },
            },
          },
        },
      },
    },
  });

  const reminded: string[] = [];

  for (const sheet of sheets) {
    const missingCount = sheet.goals.filter((g) => g.achievements.length === 0).length;
    if (missingCount === 0) continue;

    const alreadySent = await prisma.notification.findFirst({
      where: {
        userId: sheet.employeeId,
        type: "CHECKIN_REMINDER",
        title: { contains: activeQuarter },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (alreadySent) continue;

    try {
      await sendCheckInReminderEmail({
        employeeEmail: sheet.employee.email,
        employeeName: sheet.employee.name,
        quarter: activeQuarter,
        cycleName: activeCycle.name,
      });
    } catch (e) {
      console.error("[cron] check-in email failed:", e);
    }

    await createNotification({
      userId: sheet.employeeId,
      type: "REMINDER",
      title: `${activeQuarter} check-in due`,
      message: `You have ${missingCount} goal(s) still needing ${activeQuarter} updates.`,
      link: `/employee/goals/${sheet.id}/checkin`,
      category: "REMINDER",
      priority: "MEDIUM",
      metadata: { quarter: activeQuarter, cycleId: activeCycle.id, missingCount },
    });

    reminded.push(sheet.employeeId);
  }

  if (reminded.length) await bumpRealtimeVersion("checkin_reminder");

  await trackJobRun({
    jobType: "cron:check-reminders",
    status: "success",
    durationMs: Date.now() - start,
    metadata: { remindedCount: reminded.length },
  });

  return NextResponse.json({
    success: true,
    remindedCount: reminded.length,
    quarter: activeQuarter,
    employeeIds: reminded,
  });
}
