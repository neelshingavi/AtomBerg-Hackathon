import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ sharedGoalId: string }> };

const updateSharedGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

function sharedGoalAccessFilter(session: {
  user: { id: string; role: string };
}) {
  if (session.user.role === "ADMIN") return {};
  if (session.user.role === "MANAGER") {
    return { pushedById: session.user.id };
  }
  return {
    goals: {
      some: { goalSheet: { employeeId: session.user.id } },
    },
  };
}

async function findAccessibleSharedGoal(
  sharedGoalId: string,
  session: { user: { id: string; role: string } }
) {
  return prisma.sharedGoal.findFirst({
    where: {
      id: sharedGoalId,
      ...sharedGoalAccessFilter(session),
    },
    include: {
      thrustArea: { select: { id: true, name: true, color: true } },
      pushedBy: { select: { id: true, name: true, employeeCode: true } },
      cycle: { select: { id: true, name: true, fiscalYear: true } },
      goals: {
        include: {
          goalSheet: {
            select: {
              id: true,
              status: true,
              employee: {
                select: { id: true, name: true, employeeCode: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { sharedGoalId } = await context.params;
  const sharedGoal = await findAccessibleSharedGoal(sharedGoalId, session);

  if (!sharedGoal) return apiError("Shared goal not found", 404);

  return apiSuccess({ sharedGoal });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  const { sharedGoalId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = updateSharedGoalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const existing = await findAccessibleSharedGoal(sharedGoalId, session);
  if (!existing) return apiError("Shared goal not found", 404);

  if (
    session.user.role === "MANAGER" &&
    existing.pushedById !== session.user.id
  ) {
    return apiError("Forbidden", 403);
  }

  const updated = await prisma.sharedGoal.update({
    where: { id: sharedGoalId },
    data: parsed.data,
    include: {
      thrustArea: { select: { id: true, name: true, color: true } },
      pushedBy: { select: { id: true, name: true, employeeCode: true } },
      cycle: { select: { id: true, name: true, fiscalYear: true } },
      goals: {
        include: {
          goalSheet: {
            select: {
              id: true,
              status: true,
              employee: {
                select: { id: true, name: true, employeeCode: true },
              },
            },
          },
        },
      },
    },
  });

  await writeAuditLog({
    action: "UPDATED",
    entityType: "SharedGoal",
    entityId: sharedGoalId,
    createdById: session.user.id,
    previousValues: {
      title: existing.title,
      description: existing.description,
      isActive: existing.isActive,
    },
    newValues: parsed.data,
  });

  return apiSuccess({ sharedGoal: updated });
}
