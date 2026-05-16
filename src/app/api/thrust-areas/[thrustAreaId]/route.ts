import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { thrustAreaSchema } from "@/lib/validations/admin.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ thrustAreaId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { thrustAreaId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = thrustAreaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const thrustArea = await prisma.thrustArea.update({
    where: { id: thrustAreaId },
    data: parsed.data,
  });

  return apiSuccess({ thrustArea });
}
