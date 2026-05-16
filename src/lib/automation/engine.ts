import type { AutomationRule, AutomationTrigger } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { createEnhancedNotification } from "@/lib/notifications/enhanced";
import { bumpRealtimeVersion } from "@/lib/realtime/events";
import { sendTeamsNotification, getTeamsWebhookUrl } from "@/lib/teams/webhook";
import { trackJobRun } from "@/lib/observability/tracker";
import type { AutomationAction, AutomationContext } from "@/lib/automation/types";

const appUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function matchesConditions(
  conditions: Record<string, unknown>,
  ctx: AutomationContext
): boolean {
  if (Object.keys(conditions).length === 0) return true;
  if (conditions.departmentId && ctx.payload?.departmentId !== conditions.departmentId) {
    return false;
  }
  if (conditions.minDays && typeof ctx.payload?.daysOverdue === "number") {
    if (ctx.payload.daysOverdue < Number(conditions.minDays)) return false;
  }
  return true;
}

async function executeAction(
  action: AutomationAction,
  ctx: AutomationContext,
  rule: AutomationRule
) {
  const baseUrl = appUrl();

  switch (action.type) {
    case "notify": {
      let userId = action.config.userId;
      if (!userId && action.config.role === "manager" && ctx.managerId) {
        userId = ctx.managerId;
      }
      if (!userId && action.config.role === "employee" && ctx.employeeId) {
        userId = ctx.employeeId;
      }
      if (userId) {
        await createEnhancedNotification({
          userId,
          type: "AUTOMATION",
          title: action.config.title,
          message: action.config.message,
          link: action.config.link,
          category: "AUTOMATION",
          priority: "HIGH",
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          metadata: { ruleId: rule.id, ruleName: rule.name },
        });
      }
      break;
    }
    case "teams": {
      const webhook = await getTeamsWebhookUrl();
      if (webhook) {
        await sendTeamsNotification(
          webhook,
          action.config.title,
          action.config.message,
          action.config.link
            ? `${baseUrl}${action.config.link}`
            : `${baseUrl}/admin`,
          "Open AtomGoal"
        );
      }
      break;
    }
    case "audit": {
      if (ctx.goalSheetId) {
        const actorId =
          ctx.managerId ??
          ctx.employeeId ??
          (
            await prisma.user.findFirst({
              where: { role: "ADMIN", isActive: true },
              select: { id: true },
            })
          )?.id;
        if (actorId) {
          await writeAuditLog({
            action: "AUTOMATION_EXECUTED",
            entityType: action.config.entityType,
            entityId: ctx.entityId ?? ctx.goalSheetId,
            createdById: actorId,
            goalSheetId: ctx.goalSheetId,
            metadata: { ruleId: rule.id, ruleName: rule.name, automationAction: action.type },
          });
        }
      }
      break;
    }
    case "lock_sheet": {
      if (ctx.goalSheetId) {
        await prisma.goalSheet.update({
          where: { id: ctx.goalSheetId },
          data: { isLocked: true, lockedAt: new Date() },
        });
      }
      break;
    }
    default:
      break;
  }
}

export async function runAutomationForTrigger(
  trigger: AutomationTrigger,
  ctx: AutomationContext
) {
  const start = Date.now();
  const rules = await prisma.automationRule.findMany({
    where: { isActive: true, trigger },
  });

  let executed = 0;
  for (const rule of rules) {
    const conditions = (rule.conditions as Record<string, unknown>) ?? {};
    if (!matchesConditions(conditions, ctx)) {
      await prisma.automationRun.create({
        data: { ruleId: rule.id, status: "skipped", metadata: { reason: "conditions" } },
      });
      continue;
    }

    const actions = rule.actions as AutomationAction[];
    try {
      for (const action of actions) {
        await executeAction(action, ctx, rule);
      }
      await prisma.automationRun.create({
        data: { ruleId: rule.id, status: "success", metadata: { trigger } },
      });
      executed++;
    } catch (e) {
      await prisma.automationRun.create({
        data: {
          ruleId: rule.id,
          status: "failed",
          error: e instanceof Error ? e.message : "Unknown error",
        },
      });
    }
  }

  if (executed > 0) {
    await bumpRealtimeVersion(`automation:${trigger}`);
  }

  await trackJobRun({
    jobType: `automation:${trigger}`,
    status: "success",
    durationMs: Date.now() - start,
    metadata: { executed, rulesChecked: rules.length },
  });

  return { executed, rulesChecked: rules.length };
}

export async function seedDefaultAutomationRules() {
  const existing = await prisma.automationRule.count();
  if (existing > 0) return;

  await prisma.automationRule.createMany({
    data: [
      {
        name: "Notify manager on submission",
        trigger: "GOAL_SUBMITTED",
        conditions: {},
        actions: [
          {
            type: "notify",
            config: {
              role: "manager",
              title: "New goal submission",
              message: "A team member submitted goals for your review.",
              link: "/manager/approvals",
            },
          },
          {
            type: "teams",
            config: {
              title: "Goal submitted",
              message: "A goal sheet was submitted and awaits manager review.",
              link: "/manager/approvals",
            },
          },
        ],
        delayMinutes: 0,
      },
      {
        name: "Escalate delayed approvals",
        trigger: "APPROVAL_DELAYED",
        conditions: { minDays: 3 },
        actions: [
          {
            type: "notify",
            config: {
              role: "manager",
              title: "Approval overdue",
              message: "Goal approval is past SLA. Please review immediately.",
              link: "/manager/approvals",
            },
          },
        ],
        delayMinutes: 0,
      },
    ],
  });
}
