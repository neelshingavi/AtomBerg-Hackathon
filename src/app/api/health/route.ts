import { NextResponse } from "next/server";
import { isCronSecretConfigured } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { getObservabilitySummary } from "@/lib/observability/tracker";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let userCount = 0;

  try {
    userCount = await prisma.user.count();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let observability = null;
  try {
    observability = await getObservabilitySummary();
  } catch {
    /* optional */
  }

  const latencyMs = Date.now() - start;
  const cronSecretConfigured = isCronSecretConfigured();
  const healthy = dbOk && latencyMs < 3000 && cronSecretConfigured;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      checks: {
        database: dbOk ? "up" : "down",
        api: "up",
        cronSecret: cronSecretConfigured ? "configured" : "missing",
      },
      metrics: {
        healthCheckLatencyMs: latencyMs,
        registeredUsers: userCount,
        ...(observability
          ? {
              avgApiLatencyMs: observability.avgLatencyMs,
              failedJobs24h: observability.failedRuns,
              totalJobs24h: observability.totalRuns,
            }
          : {}),
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
