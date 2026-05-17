import { prisma } from "@/lib/prisma";
import { getRealtimeVersion } from "@/lib/realtime/events";
import { countOnlineUsers } from "@/lib/realtime/presence";

export type RealtimeSnapshot = {
  version: string;
  lastEvent: string | null;
  timestamp: string;
  pendingApprovals: number;
  unreadNotifications: number;
  activeEscalations: number;
  recentActivityAt: string | null;
  onlineCount: number;
};

export async function buildRealtimeSnapshot(
  userId: string,
  role: string
): Promise<RealtimeSnapshot> {
  const [version, lastEventRow, unreadNotifications, recentAudit, onlineCount] =
    await Promise.all([
      getRealtimeVersion(),
      prisma.systemConfig.findUnique({ where: { key: "realtime_last_event" } }),
      prisma.notification.count({ where: { userId, isRead: false, dismissedAt: null } }),
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      countOnlineUsers(),
    ]);

  let pendingApprovals = 0;
  let activeEscalations = 0;

  if (role === "MANAGER") {
    pendingApprovals = await prisma.goalSheet.count({
      where: { managerId: userId, status: "SUBMITTED" },
    });
  } else if (role === "ADMIN") {
    pendingApprovals = await prisma.goalSheet.count({
      where: { status: "SUBMITTED" },
    });
    activeEscalations = await prisma.escalationLog.count({
      where: { status: { not: "RESOLVED" } },
    });
  }

  return {
    version,
    lastEvent: lastEventRow?.value ?? null,
    timestamp: new Date().toISOString(),
    pendingApprovals,
    unreadNotifications,
    activeEscalations,
    recentActivityAt: recentAudit?.createdAt.toISOString() ?? null,
    onlineCount,
  };
}
