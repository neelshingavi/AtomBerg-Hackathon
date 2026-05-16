import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

/** Manager marks a submitted sheet as under review (SOLUTION workflow). */
export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  const { goalId: goalSheetId } = await context.params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    select: { id: true, status: true, managerId: true, employeeId: true },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (
    session.user.role === "MANAGER" &&
    sheet.managerId !== session.user.id
  ) {
    return apiError("Forbidden", 403);
  }

  if (sheet.status !== "SUBMITTED") {
    return apiSuccess({ goalSheet: sheet, unchanged: true });
  }

  const updated = await prisma.goalSheet.update({
    where: { id: goalSheetId },
    data: {
      status: "UNDER_REVIEW",
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    action: "UPDATED",
    entityType: "GoalSheet",
    entityId: goalSheetId,
    createdById: session.user.id,
    affectedUserId: sheet.employeeId,
    goalSheetId,
    previousValues: { status: "SUBMITTED" },
    newValues: { status: "UNDER_REVIEW" },
    metadata: { event: "review_started" },
    ipAddress: getRequestIp(req),
  });

  return apiSuccess({ goalSheet: updated });
}
