import { NextRequest } from "next/server";

let cronSecretWarningLogged = false;

function warnMissingCronSecret() {
  if (cronSecretWarningLogged || process.env.CRON_SECRET) return;
  cronSecretWarningLogged = true;
  console.error(
    "[CRON AUTH] CRON_SECRET is not set. All cron jobs will be rejected. " +
      "Set CRON_SECRET in your environment variables."
  );
}

export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET?.trim());
}

export function verifyCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    warnMissingCronSecret();
    return false;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cronHeader = req.headers.get("x-vercel-cron-secret");
  return cronHeader === secret;
}

// Log once at module load in production-like environments
warnMissingCronSecret();
