import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { departmentSchema } from "@/lib/validations/admin.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ departmentId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { departmentId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = departmentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: parsed.data,
  });

  return apiSuccess({ department });
}
