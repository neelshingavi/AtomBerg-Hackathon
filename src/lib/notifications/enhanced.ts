import { prisma } from "@/lib/prisma";
import type {
  NotificationCategory,
  NotificationPriority,
  Prisma,
} from "@prisma/client";
import { bumpRealtimeVersion } from "@/lib/realtime/events";

const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  GOAL_SUBMITTED: "APPROVAL",
  GOAL_APPROVED: "APPROVAL",
  GOAL_REJECTED: "APPROVAL",
  ESCALATION: "ESCALATION",
  COMMENT: "COMMENT",
  MENTION: "COMMENT",
  UNLOCK_REQUEST: "UNLOCK",
  SHARED_GOAL: "SHARED_GOAL",
  CYCLE: "CYCLE",
  REMINDER: "REMINDER",
  RISK: "RISK",
  AUTOMATION: "AUTOMATION",
};

const TYPE_TO_PRIORITY: Record<string, NotificationPriority> = {
  ESCALATION: "CRITICAL",
  GOAL_REJECTED: "HIGH",
  GOAL_SUBMITTED: "HIGH",
  RISK: "HIGH",
  UNLOCK_REQUEST: "MEDIUM",
  REMINDER: "MEDIUM",
  GOAL_APPROVED: "LOW",
  COMMENT: "LOW",
  MENTION: "MEDIUM",
};

export async function createEnhancedNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      priority: params.priority ?? TYPE_TO_PRIORITY[params.type] ?? "MEDIUM",
      category: params.category ?? TYPE_TO_CATEGORY[params.type] ?? "SYSTEM",
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await bumpRealtimeVersion(`notification:${params.type}`);
  return notification;
}

export async function dismissNotification(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { dismissedAt: new Date(), isRead: true, readAt: new Date() },
  });
}

export async function bulkDismissNotifications(userId: string, ids: string[]) {
  return prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { dismissedAt: new Date(), isRead: true, readAt: new Date() },
  });
}
