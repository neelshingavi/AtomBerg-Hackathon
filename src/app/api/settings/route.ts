import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TEAMS_WEBHOOK_KEY = "teams_webhook_url";

const settingsSchema = z.object({
  teamsWebhookUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const row = await prisma.systemConfig.findUnique({
    where: { key: TEAMS_WEBHOOK_KEY },
  });

  const url = row?.value ?? process.env.TEAMS_WEBHOOK_URL ?? "";
  const masked = url ? `${url.slice(0, 30)}…` : "";

  return apiSuccess({
    teamsWebhookUrl: url,
    teamsWebhookConfigured: Boolean(url),
    teamsWebhookMasked: masked,
    azureAdConfigured: Boolean(
      process.env.AZURE_AD_CLIENT_ID?.trim() &&
        process.env.AZURE_AD_CLIENT_SECRET?.trim() &&
        process.env.AZURE_AD_TENANT_ID?.trim()
    ),
  });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const value = parsed.data.teamsWebhookUrl ?? "";

  if (value) {
    await prisma.systemConfig.upsert({
      where: { key: TEAMS_WEBHOOK_KEY },
      create: {
        key: TEAMS_WEBHOOK_KEY,
        value,
        description: "Microsoft Teams incoming webhook URL",
        updatedById: session.user.id,
      },
      update: { value, updatedById: session.user.id },
    });
  } else {
    await prisma.systemConfig.deleteMany({ where: { key: TEAMS_WEBHOOK_KEY } });
  }

  return apiSuccess({ teamsWebhookUrl: value, teamsWebhookConfigured: Boolean(value) });
}
