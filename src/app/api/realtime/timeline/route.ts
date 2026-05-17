import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { fetchLiveActivityStream } from "@/lib/realtime/activity-stream";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const rErr = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (rErr) return rErr;

  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") ?? 50));
  const type = req.nextUrl.searchParams.get("type");

  let items = await fetchLiveActivityStream({ limit });

  if (type) {
    items = items.filter((i) => i.eventType === type);
  }

  const annotations = await prisma.operationalAlert.findMany({
    where: { status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      severity: true,
      createdAt: true,
      recommendation: true,
    },
  });

  return apiSuccess({
    items,
    annotations: annotations.map((a) => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      recommendation: a.recommendation,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
