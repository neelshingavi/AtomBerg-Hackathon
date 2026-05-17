import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { listOnlineUsers, upsertPresence } from "@/lib/realtime/presence";
import type { PresenceStatus } from "@prisma/client";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;
  const users = await listOnlineUsers(32);
  return apiSuccess({ users });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const status = (body.status as PresenceStatus) ?? "ONLINE";
  const currentView = body.currentView as string | undefined;

  await upsertPresence(session.user.id, { status, currentView });
  return apiSuccess({ ok: true });
}
