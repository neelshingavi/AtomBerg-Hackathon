import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { updateUserSchema } from "@/lib/validations/user.schema";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { userId } = await context.params;

  if (session.user.role === "EMPLOYEE" && session.user.id !== userId) {
    return apiError("Forbidden", 403);
  }

  if (session.user.role === "MANAGER" && session.user.id !== userId) {
    const report = await prisma.user.findFirst({
      where: { id: userId, managerId: session.user.id },
      select: { id: true },
    });
    if (!report) return apiError("Forbidden", 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      employeeCode: true,
      role: true,
      isActive: true,
      designation: true,
      joiningDate: true,
      department: { select: { id: true, name: true, code: true } },
      manager: { select: { id: true, name: true, employeeCode: true } },
      _count: { select: { directReports: true, goalSheets: true } },
    },
  });

  if (!user) return apiError("User not found", 404);

  return apiSuccess({ user });
}

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

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return apiError("User not found", 404);

  if (
    parsed.data.password &&
    targetUser.role === "ADMIN" &&
    targetUser.id !== session.user.id
  ) {
    return apiError("Cannot change another admin's password", 403);
  }

  if (parsed.data.isActive === false && targetUser.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    if (adminCount <= 1) {
      return apiError("Cannot deactivate the only active admin account", 400);
    }
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
