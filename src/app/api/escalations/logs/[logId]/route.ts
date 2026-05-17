import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ logId: string }> };

const resolveSchema = z.object({
  status: z.enum(["RESOLVED", "ESCALATED"]).optional(),
  resolvedNote: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const { logId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const existing = await prisma.escalationLog.findUnique({
    where: { id: logId },
  });

  if (!existing) return apiError("Escalation log not found", 404);

  if (
    session.user.role === "MANAGER" &&
    existing.managerId !== session.user.id
  ) {
    return apiError("Forbidden", 403);
  }

  const log = await prisma.escalationLog.update({
    where: { id: logId },
    data: {
      status: parsed.data.status ?? "RESOLVED",
      resolvedAt: new Date(),
      resolvedNote: parsed.data.resolvedNote,
    },
    include: {
      employee: { select: { name: true, employeeCode: true } },
      manager: { select: { name: true } },
      rule: { select: { trigger: true, daysThreshold: true } },
    },
  });

  return apiSuccess({ log });
}
