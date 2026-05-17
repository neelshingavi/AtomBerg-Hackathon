import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { isGoalSettingOpen } from "@/lib/cycle";
import { validateSubmission } from "@/lib/calculations/weightage";
import { createNotification, goalSheetInclude, serializeGoalSheet } from "@/lib/goals";
import { sendGoalSubmittedEmail } from "@/lib/email/resend";
import { notifyGoalSubmittedTeams } from "@/lib/teams/webhook";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { goalId: goalSheetId } = await context.params;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: goalSheetId },
    include: {
      goals: true,
      cycle: true,
      employee: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sheet) return apiError("Goal sheet not found", 404);

  if (sheet.employeeId !== session.user.id && session.user.role !== "ADMIN") {
    return apiError("Forbidden", 403);
  }

  if (!["DRAFT", "REWORK"].includes(sheet.status)) {
    return apiError(`Cannot submit sheet with status ${sheet.status}`, 400);
  }

  if (sheet.goals.length === 0) {
    return apiError("You must add at least 1 goal before submitting.", 400);
  }

  if (!isGoalSettingOpen(sheet.cycle)) {
    return apiError("Goal setting window is not open", 403);
  }

  const validation = validateSubmission(
    sheet.goals.map((g) => ({ title: g.title, weightage: g.weightage }))
  );
  if (!validation.isValid) {
    return apiError(validation.errors.join("; "));
  }

  const clientIp = getRequestIp(req);

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.goalSheet.updateMany({
      where: {
        id: goalSheetId,
        status: { in: ["DRAFT", "REWORK"] },
      },
      data: {
        status: "SUBMITTED",
        submittedAt: sheet.submittedAt ?? new Date(),
        rejectedAt: null,
      },
    });

    if (count === 0) {
      throw new Error("CONCURRENT_SUBMIT");
    }

    const result = await tx.goalSheet.findUniqueOrThrow({
      where: { id: goalSheetId },
      include: goalSheetInclude,
    });

    await writeAuditLog(
      {
        action: "SUBMITTED",
        entityType: "GoalSheet",
        entityId: goalSheetId,
        createdById: session.user.id,
        affectedUserId: sheet.employeeId,
        goalSheetId,
        previousValues: { status: sheet.status },
        newValues: { status: "SUBMITTED" },
        ipAddress: clientIp,
      },
      tx
    );

    return result;
  }).catch((e) => {
    if (e instanceof Error && e.message === "CONCURRENT_SUBMIT") {
      return null;
    }
    throw e;
  });

  if (!updated) {
    return apiError(`Cannot submit sheet with status ${sheet.status}`, 409);
  }

  if (sheet.managerId && sheet.manager) {
    await createNotification({
      userId: sheet.managerId,
      type: "GOAL_SUBMITTED",
      title: "Goal sheet submitted for approval",
      message: `${sheet.employee.name} submitted their goal sheet for ${sheet.cycle.name}.`,
      link: `/manager/approvals/${goalSheetId}`,
    });

    try {
      await sendGoalSubmittedEmail({
        managerEmail: sheet.manager.email,
        managerName: sheet.manager.name,
        employeeName: sheet.employee.name,
        sheetId: goalSheetId,
      });
    } catch (e) {
      console.error("[submit] email failed:", e);
    }

    void notifyGoalSubmittedTeams(
      sheet.employee.name,
      goalSheetId,
      sheet.managerId ?? undefined
    );

    const { runAutomationForTrigger } = await import("@/lib/automation/engine");
    const { bumpRealtimeVersion } = await import("@/lib/realtime/events");
    void runAutomationForTrigger("GOAL_SUBMITTED", {
      goalSheetId,
      employeeId: sheet.employeeId,
      managerId: sheet.managerId ?? undefined,
      entityType: "GoalSheet",
      entityId: goalSheetId,
    });
    await bumpRealtimeVersion("goal_submitted");
    const { publishOperationalEvent } = await import("@/lib/realtime/publish");
    await publishOperationalEvent({
      type: "GOAL_SUBMITTED",
      title: "Goal sheet submitted",
      description: `${sheet.employee.name} · ${sheet.cycle.name}`,
      severity: "medium",
      actorId: session.user.id,
      entityType: "GoalSheet",
      entityId: goalSheetId,
      href: `/manager/approvals/${goalSheetId}`,
      cycleId: sheet.cycleId,
    });
  }

  return apiSuccess({ goalSheet: serializeGoalSheet(updated) });
}
