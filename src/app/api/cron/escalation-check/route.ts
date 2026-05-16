import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { runEscalationEngine } from "@/lib/escalation";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  try {
    const result = await runEscalationEngine();
    const { trackJobRun } = await import("@/lib/observability/tracker");
    await trackJobRun({
      jobType: "cron:escalation-check",
      status: "success",
      durationMs: Date.now() - start,
      metadata: result,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const { trackJobRun } = await import("@/lib/observability/tracker");
    await trackJobRun({
      jobType: "cron:escalation-check",
      status: "failed",
      durationMs: Date.now() - start,
      error: e instanceof Error ? e.message : "Unknown",
    });
    throw e;
  }
}
