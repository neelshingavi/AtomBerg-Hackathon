import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { isQuarterWindowOpen, type Quarter } from "@/lib/cycle";
import { checkinInputSchema } from "@/lib/validations/achievement.schema";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const goalSheetId = req.nextUrl.searchParams.get("goalSheetId");
  const quarter = req.nextUrl.searchParams.get("quarter");

  if (!goalSheetId) return apiError("goalSheetId is required");

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    select: { employeeId: true, managerId: true },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  const canView =
    session.user.role === "ADMIN" ||
    sheet.managerId === session.user.id ||
    (sheet.employeeId === session.user.id && session.user.role === "EMPLOYEE");

  if (!canView) return apiError("Forbidden", 403);

  const comments = await prisma.checkinComment.findMany({
    where: {
      goalSheetId,
      ...(quarter ? { quarter } : {}),
      ...(session.user.role === "EMPLOYEE" ? { isPrivate: false } : {}),
    },
    include: {
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ comments });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = checkinInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { goalSheetId, quarter, comment, rating, isPrivate } = parsed.data;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: { employee: { select: { id: true, name: true } } },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (session.user.role === "MANAGER" && sheet.managerId !== session.user.id) {
    return apiError("Forbidden", 403);
  }

  if (sheet.status !== "APPROVED") {
    return apiError("Check-ins are only for approved goal sheets", 400);
  }

  const cycle = await prisma.goalCycle.findUnique({
    where: { id: sheet.cycleId },
  });
  if (!cycle) return apiError("Cycle not found", 404);

  if (!isQuarterWindowOpen(cycle, quarter as Quarter)) {
    return apiError(`${quarter} check-in window is not currently open`, 403);
  }

  const checkin = await prisma.checkinComment.upsert({
    where: {
      goalSheetId_managerId_quarter: {
        goalSheetId,
        managerId: session.user.id,
        quarter,
      },
    },
    update: { comment, rating, isPrivate: isPrivate ?? false },
    create: {
      goalSheetId,
      managerId: session.user.id,
      quarter,
      comment,
      rating,
      isPrivate: isPrivate ?? false,
    },
    include: { manager: { select: { name: true } } },
  });

  await writeAuditLog({
    action: "CHECKIN_ADDED",
    entityType: "CheckinComment",
    entityId: checkin.id,
    createdById: session.user.id,
    affectedUserId: sheet.employeeId,
    goalSheetId,
    newValues: { quarter, rating },
  });

  if (!isPrivate) {
    await prisma.notification.create({
      data: {
        userId: sheet.employeeId,
        type: "CHECKIN_COMMENT",
        title: `${quarter} check-in feedback`,
        message: `${session.user.name ?? "Your manager"} left feedback on your ${quarter} check-in.`,
        link: `/employee/goals/${goalSheetId}/checkin`,
      },
    });
  }

  return apiSuccess({ checkin }, 201);
}
