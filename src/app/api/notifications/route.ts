import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { NotificationCategory, NotificationPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 30)));
  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const category = req.nextUrl.searchParams.get("category") as NotificationCategory | null;
  const priority = req.nextUrl.searchParams.get("priority") as NotificationPriority | null;
  const includeDismissed = req.nextUrl.searchParams.get("includeDismissed") === "true";

  const where = {
    userId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
    ...(!includeDismissed ? { dismissedAt: null } : {}),
  };

  const [notifications, unreadCount, byCategory] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false, dismissedAt: null },
    }),
    prisma.notification.groupBy({
      by: ["category"],
      where: { userId: session.user.id, isRead: false, dismissedAt: null },
      _count: true,
    }),
  ]);

  return apiSuccess({
    notifications,
    unreadCount,
    categoryCounts: Object.fromEntries(
      byCategory.map((c) => [c.category, c._count])
    ),
  });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const payload = body as {
    action?: string;
    ids?: string[];
  };

  if (payload.action === "mark_all_read") {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return apiSuccess({ markedAll: true });
  }

  if (payload.action === "dismiss" && payload.ids?.length) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, id: { in: payload.ids } },
      data: { dismissedAt: new Date(), isRead: true, readAt: new Date() },
    });
    return apiSuccess({ dismissed: payload.ids.length });
  }

  return apiError("Unknown action");
}
