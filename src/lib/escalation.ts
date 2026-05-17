import type { EscalationRule, GoalCycle, User } from "@prisma/client";
import { createNotification } from "@/lib/goals";
import {
  getActiveCycle,
  getActiveQuarter,
  getQuarterWindow,
  type Quarter,
} from "@/lib/cycle";
import { sendEscalationAlertEmail } from "@/lib/email/resend";
import { notifyEscalationTeams } from "@/lib/teams/webhook";
import { bumpRealtimeVersion } from "@/lib/realtime/events";
import { prisma } from "@/lib/prisma";

const TRIGGER_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: "Goal sheet not submitted",
  GOAL_NOT_APPROVED: "Goal sheet not approved",
  CHECKIN_NOT_COMPLETED: "Quarterly check-in not completed",
};

async function createEscalation(
  rule: EscalationRule,
  employee: User,
  cycle: GoalCycle,
  manager?: User | null
) {
  const existing = await prisma.escalationLog.findFirst({
    where: {
      ruleId: rule.id,
      employeeId: employee.id,
      status: { in: ["PENDING", "NOTIFIED", "ESCALATED"] },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  if (existing) return null;

  const log = await prisma.escalationLog.create({
    data: {
      ruleId: rule.id,
      employeeId: employee.id,
      managerId: manager?.id,
      status: "NOTIFIED",
      notificationsSent: { at: new Date().toISOString() },
    },
  });

  const triggerLabel = TRIGGER_LABELS[rule.trigger] ?? rule.trigger;
  const recipients: Array<{ user: User; role: string }> = [];

  if (rule.notifyEmployee) recipients.push({ user: employee, role: "employee" });
  if (rule.notifyManager && manager) recipients.push({ user: manager, role: "manager" });

  if (rule.notifyHR) {
    const hrUsers = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      take: 3,
    });
    for (const hr of hrUsers) {
      recipients.push({ user: hr, role: "hr" });
    }
  }

  for (const { user, role } of recipients) {
    const link =
      role === "manager"
        ? "/manager/approvals"
        : role === "employee"
          ? "/employee/goals"
          : "/admin";

    await createNotification({
      userId: user.id,
      type: "ESCALATION",
      title: `Escalation: ${triggerLabel}`,
      message: `${employee.name} — ${cycle.name}`,
      link,
      metadata: { escalationLogId: log.id, trigger: rule.trigger },
    });

    try {
      await sendEscalationAlertEmail({
        to: user.email,
        recipientName: user.name,
        employeeName: employee.name,
        triggerLabel,
        cycleName: cycle.name,
        daysThreshold: rule.daysThreshold,
      });
    } catch (e) {
      console.error("[escalation] email failed:", e);
    }
  }

  void notifyEscalationTeams(employee.name, triggerLabel);
  await bumpRealtimeVersion("escalation");

  return log;
}

export async function runEscalationEngine() {
  const rules = await prisma.escalationRule.findMany({
    where: { isActive: true },
  });

  const activeCycle = await getActiveCycle();
  if (!activeCycle) return { escalationsCreated: 0, message: "No active cycle" };

  let created = 0;
  const thresholdDate = new Date();

  for (const rule of rules) {
    thresholdDate.setTime(Date.now());
    thresholdDate.setDate(thresholdDate.getDate() - rule.daysThreshold);

    switch (rule.trigger) {
      case "GOAL_NOT_SUBMITTED": {
        if (activeCycle.goalSettingStart >= thresholdDate) break;

        const employees = await prisma.user.findMany({
          where: {
            role: "EMPLOYEE",
            isActive: true,
            goalSheets: {
              none: {
                cycleId: activeCycle.id,
                status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
              },
            },
          },
          include: { manager: true },
        });

        const logs = await Promise.all(
          employees.map((employee) =>
            createEscalation(rule, employee, activeCycle, employee.manager)
          )
        );
        created += logs.filter(Boolean).length;
        break;
      }

      case "GOAL_NOT_APPROVED": {
        const pendingSheets = await prisma.goalSheet.findMany({
          where: {
            cycleId: activeCycle.id,
            status: "SUBMITTED",
            submittedAt: { lt: thresholdDate },
          },
          include: { employee: true, manager: true },
        });

        const approvalLogs = await Promise.all(
          pendingSheets.map((sheet) =>
            createEscalation(rule, sheet.employee, activeCycle, sheet.manager)
          )
        );
        created += approvalLogs.filter(Boolean).length;
        break;
      }

      case "CHECKIN_NOT_COMPLETED": {
        const activeQuarter = getActiveQuarter(activeCycle);
        if (!activeQuarter) break;

        const { start: quarterStart } = getQuarterWindow(
          activeCycle,
          activeQuarter as Quarter
        );
        if (quarterStart >= thresholdDate) break;

        const overdueSheets = await prisma.goalSheet.findMany({
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
          include: { employee: true, manager: true },
        });

        const checkinLogs = await Promise.all(
          overdueSheets.map((sheet) =>
            createEscalation(rule, sheet.employee, activeCycle, sheet.manager)
          )
        );
        created += checkinLogs.filter(Boolean).length;
        break;
      }
    }
  }

  return { escalationsCreated: created, cycleId: activeCycle.id };
}
