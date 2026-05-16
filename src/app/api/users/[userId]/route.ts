import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { updateUserSchema } from "@/lib/validations/user.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { userId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { password, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      employeeCode: true,
      role: true,
      isActive: true,
      designation: true,
      department: { select: { name: true } },
      manager: { select: { name: true } },
    },
  });

  return apiSuccess({ user });
}
