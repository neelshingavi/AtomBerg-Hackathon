import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { unlockSheetSchema } from "@/lib/validations/admin.schema";
import { goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { goalId: goalSheetId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = unlockSheetSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);
  if (!sheet.isLocked) return apiError("Goal sheet is not locked", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const unlockedSheet = await tx.goalSheet.update({
      where: { id: goalSheetId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
        status: "REWORK",
      },
      include: goalSheetInclude,
    });

    await writeAuditLog(
      {
        action: "UNLOCKED",
        entityType: "GoalSheet",
        entityId: goalSheetId,
        createdById: session.user.id,
        affectedUserId: sheet.employeeId,
        goalSheetId,
        previousValues: { isLocked: true, status: sheet.status },
        newValues: { isLocked: false, status: "REWORK" },
        metadata: { reason: parsed.data.reason },
      },
      tx
    );

    return unlockedSheet;
  });

  await prisma.notification.create({
    data: {
      userId: sheet.employeeId,
      type: "GOAL_UNLOCKED",
      title: "Goals unlocked for editing",
      message:
        parsed.data.reason ?? "Your goals have been unlocked for editing.",
      link: `/employee/goals/${goalSheetId}`,
    },
  });

  return apiSuccess({ goalSheet: serializeGoalSheet(updated) });
}
