import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { escalationRuleSchema } from "@/lib/validations/escalation.schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const rules = await prisma.escalationRule.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { escalationLogs: true } } },
  });

  return apiSuccess({ rules });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = escalationRuleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const rule = await prisma.escalationRule.create({ data: parsed.data });
  return apiSuccess({ rule }, 201);
}
