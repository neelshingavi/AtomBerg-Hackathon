import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { updateCycleSchema } from "@/lib/validations/cycle.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ cycleId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { cycleId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = updateCycleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { isActive, ...data } = parsed.data;

  const cycle = await prisma.$transaction(async (tx) => {
    if (isActive === true) {
      await tx.goalCycle.updateMany({
        where: { id: { not: cycleId } },
        data: { isActive: false },
      });
      await tx.systemConfig.upsert({
        where: { key: "active_cycle_id" },
        update: { value: cycleId },
        create: { key: "active_cycle_id", value: cycleId },
      });
    }

    return tx.goalCycle.update({
      where: { id: cycleId },
      data: { ...data, ...(isActive !== undefined ? { isActive } : {}) },
    });
  });

  return apiSuccess({ cycle });
}
