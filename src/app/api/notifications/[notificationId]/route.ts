import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ notificationId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { notificationId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const isRead = (body as { isRead?: boolean })?.isRead;
  if (typeof isRead !== "boolean") {
    return apiError("isRead boolean is required");
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    return apiError("Notification not found", 404);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead,
      readAt: isRead ? new Date() : null,
    },
  });

  return apiSuccess({ notification: updated });
}
