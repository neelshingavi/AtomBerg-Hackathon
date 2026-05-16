import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ ruleId: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { ruleId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON");
  }

  const rule = await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      ...(body.name != null ? { name: String(body.name) } : {}),
      ...(body.isActive != null ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.actions != null ? { actions: body.actions as object } : {}),
      ...(body.conditions != null ? { conditions: body.conditions as object } : {}),
    },
  });

  return apiSuccess({ rule });
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { ruleId } = await context.params;
  await prisma.automationRule.delete({ where: { id: ruleId } });
  return apiSuccess({ deleted: true });
}
