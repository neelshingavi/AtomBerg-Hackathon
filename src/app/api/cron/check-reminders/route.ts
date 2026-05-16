import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { createNotification } from "@/lib/goals";
import { getActiveCycle, getActiveQuarter } from "@/lib/cycle";
import { sendCheckInReminderEmail } from "@/lib/email/resend";
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

  const sheetsNeedingUpdate = await prisma.goalSheet.findMany({
    where: {
      cycleId: activeCycle.id,
      status: "APPROVED",
      isLocked: true,
      goals: {
        some: {
          achievements: {
            none: {
              quarter: activeQuarter,
              actualValue: { not: null },
            },
          },
        },
      },
    },
    include: { employee: true },
  });

  const reminded: string[] = [];

  for (const sheet of sheetsNeedingUpdate) {
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
      message: `Please update your achievements for ${activeQuarter}. The window is open now.`,
      link: `/employee/goals/${sheet.id}/checkin`,
      category: "REMINDER",
      priority: "MEDIUM",
      metadata: { quarter: activeQuarter, cycleId: activeCycle.id },
    });

    reminded.push(sheet.employeeId);
  }

  const { bumpRealtimeVersion } = await import("@/lib/realtime/events");
  if (reminded.length) await bumpRealtimeVersion("checkin_reminder");

  const { trackJobRun } = await import("@/lib/observability/tracker");
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
