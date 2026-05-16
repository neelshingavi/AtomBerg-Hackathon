import { prisma } from "@/lib/prisma";

export async function trackJobRun(params: {
  jobType: string;
  status: "success" | "failed";
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.systemJobRun.create({
      data: {
        jobType: params.jobType,
        status: params.status,
        durationMs: params.durationMs,
        error: params.error,
        metadata: params.metadata as object | undefined,
      },
    });
  } catch (e) {
    console.error("[observability] failed to track job:", e);
  }
}

export async function trackApiLatency(
  route: string,
  durationMs: number,
  status: number
) {
  if (durationMs < 2000 && status < 500) return;
  await trackJobRun({
    jobType: `api:${route}`,
    status: status >= 500 ? "failed" : "success",
    durationMs,
    metadata: { status },
  });
}

export async function getObservabilitySummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [runs, failed, avgLatency, emailRuns, cronRuns] = await Promise.all([
    prisma.systemJobRun.count({ where: { createdAt: { gte: since } } }),
    prisma.systemJobRun.count({
      where: { createdAt: { gte: since }, status: "failed" },
    }),
    prisma.systemJobRun.aggregate({
      where: { createdAt: { gte: since }, durationMs: { not: null } },
      _avg: { durationMs: true },
    }),
    prisma.systemJobRun.findMany({
      where: { createdAt: { gte: since }, jobType: { startsWith: "email:" } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.systemJobRun.findMany({
      where: { createdAt: { gte: since }, jobType: { startsWith: "cron:" } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    periodHours: 24,
    totalRuns: runs,
    failedRuns: failed,
    avgLatencyMs: Math.round(avgLatency._avg.durationMs ?? 0),
    recentEmailJobs: emailRuns,
    recentCronJobs: cronRuns,
  };
}
