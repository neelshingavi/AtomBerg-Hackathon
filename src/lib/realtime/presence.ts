import { prisma } from "@/lib/prisma";
import type { PresenceStatus } from "@prisma/client";
import type { PresenceUser } from "./types";

const ONLINE_THRESHOLD_MS = 90_000;

export async function upsertPresence(
  userId: string,
  params: { status?: PresenceStatus; currentView?: string }
) {
  return prisma.userPresence.upsert({
    where: { userId },
    create: {
      userId,
      status: params.status ?? "ONLINE",
      currentView: params.currentView,
      lastSeenAt: new Date(),
    },
    update: {
      status: params.status ?? "ONLINE",
      currentView: params.currentView,
      lastSeenAt: new Date(),
    },
  });
}

export async function listOnlineUsers(limit = 24): Promise<PresenceUser[]> {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);
  const rows = await prisma.userPresence.findMany({
    where: { lastSeenAt: { gte: cutoff } },
    take: limit,
    orderBy: { lastSeenAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    userId: r.userId,
    name: r.user.name,
    status: r.status,
    currentView: r.currentView ?? undefined,
    department: r.user.department?.name,
    lastSeenAt: r.lastSeenAt.toISOString(),
  }));
}

export async function countOnlineUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);
  return prisma.userPresence.count({
    where: { lastSeenAt: { gte: cutoff } },
  });
}
