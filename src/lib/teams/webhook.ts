import { prisma } from "@/lib/prisma";

const TEAMS_WEBHOOK_KEY = "teams_webhook_url";

async function getTeamsWebhookUrl(): Promise<string | null> {
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

export async function notifyGoalSubmittedTeams(
  employeeName: string,
  sheetId: string
) {
  const webhookUrl = await getTeamsWebhookUrl();
  if (!webhookUrl) return;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    await sendTeamsNotification(
      webhookUrl,
      "Goal sheet submitted",
      `${employeeName} has submitted their goals for review. Please approve or provide feedback within 5 working days.`,
      `${baseUrl}/manager/approvals/${sheetId}`,
      "Review goals"
    );
  } catch (e) {
    console.error("[teams] notify failed:", e);
  }
}
