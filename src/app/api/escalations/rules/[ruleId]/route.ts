import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { updateEscalationRuleSchema } from "@/lib/validations/escalation.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ ruleId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { ruleId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = updateEscalationRuleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const rule = await prisma.escalationRule.update({
    where: { id: ruleId },
    data: parsed.data,
  });

  return apiSuccess({ rule });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { ruleId } = await context.params;

  const existing = await prisma.escalationRule.findUnique({
    where: { id: ruleId },
  });
  if (!existing) return apiError("Rule not found", 404);

  await prisma.escalationRule.delete({ where: { id: ruleId } });

  return apiSuccess({ deleted: true });
}
