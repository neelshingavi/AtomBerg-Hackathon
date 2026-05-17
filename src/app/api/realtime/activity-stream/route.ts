import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { fetchLiveActivityStream } from "@/lib/realtime/activity-stream";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const limit = Math.min(80, Number(req.nextUrl.searchParams.get("limit") ?? 40));
  const items = await fetchLiveActivityStream({ limit });
  return apiSuccess({ items });
}
