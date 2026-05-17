import { prisma } from "@/lib/prisma";

export async function recordFailedEmail(
  type: string,
  payload: Record<string, unknown>
) {
  const key = `failed_email:${Date.now()}:${type}`;
  try {
    await prisma.systemConfig.create({
      data: {
        key,
        value: JSON.stringify({ type, payload, at: new Date().toISOString() }),
        description: "Failed email for retry",
      },
    });
  } catch (e) {
    console.error("[email-failure] could not persist failed email record:", e);
  }
}
