import { prisma } from "@/lib/prisma";

const TEAMS_WEBHOOK_KEY = "teams_webhook_url";

/** Global webhook by default; optional per-manager override via `teams_webhook_url:{managerId}`. */
export async function getTeamsWebhookUrl(managerId?: string): Promise<string | null> {
  if (managerId) {
    const perManager = await prisma.systemConfig.findUnique({
      where: { key: `${TEAMS_WEBHOOK_KEY}:${managerId}` },
    });
    if (perManager?.value) return perManager.value;
  }

  const row = await prisma.systemConfig.findUnique({
    where: { key: TEAMS_WEBHOOK_KEY },
  });
  return row?.value ?? process.env.TEAMS_WEBHOOK_URL ?? null;
}

interface AdaptiveCardPayload {
  type: "message";
  attachments: Array<{
    contentType: "application/vnd.microsoft.card.adaptive";
    content: object;
  }>;
}

export async function sendTeamsNotification(
  webhookUrl: string,
  title: string,
  message: string,
  actionUrl: string,
  actionLabel = "View details"
) {
  const payload: AdaptiveCardPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: title,
              size: "Large",
              weight: "Bolder",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: message,
              wrap: true,
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: actionLabel,
              url: actionUrl,
              style: "positive",
            },
          ],
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("[teams] webhook failed:", res.status, await res.text());
  }
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function notifyGoalSubmittedTeams(
  employeeName: string,
  sheetId: string,
  managerId?: string
) {
  const webhookUrl = await getTeamsWebhookUrl(managerId);
  if (!webhookUrl) return;

  try {
    await sendTeamsNotification(
      webhookUrl,
      "Goal sheet submitted",
      `${employeeName} has submitted their goals for review. Please approve or provide feedback within 5 working days.`,
      `${baseUrl()}/manager/approvals/${sheetId}`,
      "Review goals"
    );
  } catch (e) {
    console.error("[teams] notify failed:", e);
  }
}

export async function notifyGoalApprovedTeams(
  employeeName: string,
  managerName: string,
  sheetId: string,
  managerId?: string
) {
  const webhookUrl = await getTeamsWebhookUrl(managerId);
  if (!webhookUrl) return;
  try {
    await sendTeamsNotification(
      webhookUrl,
      "Goals approved",
      `${managerName} approved ${employeeName}'s goal sheet.`,
      `${baseUrl()}/employee/goals/${sheetId}`,
      "View goals"
    );
  } catch (e) {
    console.error("[teams] approved notify failed:", e);
  }
}

export async function notifyEscalationTeams(
  employeeName: string,
  triggerLabel: string
) {
  const webhookUrl = await getTeamsWebhookUrl();
  if (!webhookUrl) return;
  try {
    await sendTeamsNotification(
      webhookUrl,
      "Escalation triggered",
      `${employeeName}: ${triggerLabel}. Immediate attention required.`,
      `${baseUrl()}/admin/escalations`,
      "View escalations"
    );
  } catch (e) {
    console.error("[teams] escalation notify failed:", e);
  }
}

export async function notifySharedGoalPushedTeams(
  title: string,
  count: number
) {
  const webhookUrl = await getTeamsWebhookUrl();
  if (!webhookUrl) return;
  try {
    await sendTeamsNotification(
      webhookUrl,
      "Shared goal assigned",
      `"${title}" pushed to ${count} employee(s).`,
      `${baseUrl()}/admin/shared-goals`,
      "View shared goals"
    );
  } catch (e) {
    console.error("[teams] shared goal notify failed:", e);
  }
}

export async function notifyCheckinReminderTeams(
  employeeName: string,
  quarter: string
) {
  const webhookUrl = await getTeamsWebhookUrl();
  if (!webhookUrl) return;
  try {
    await sendTeamsNotification(
      webhookUrl,
      "Check-in reminder",
      `${employeeName} has a pending ${quarter} check-in.`,
      `${baseUrl()}/manager/team`,
      "Review team"
    );
  } catch (e) {
    console.error("[teams] checkin notify failed:", e);
  }
}
