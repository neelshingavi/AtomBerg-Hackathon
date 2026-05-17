import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for audit trails.
 * Prefers Vercel-injected headers; only trusts X-Forwarded-For when explicitly enabled.
 */
export function getRequestIp(req: NextRequest): string | undefined {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first;
  }

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }

  return undefined;
}
