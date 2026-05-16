import { NextRequest } from "next/server";

export function verifyCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Vercel Cron also sends this header on scheduled invocations
  const cronHeader = req.headers.get("x-vercel-cron-secret");
  return cronHeader === secret;
}
