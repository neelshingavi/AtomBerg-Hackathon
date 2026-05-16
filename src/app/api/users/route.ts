import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { createUserSchema } from "@/lib/validations/user.schema";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { searchParams } = req.nextUrl;
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const users = await prisma.user.findMany({
    where: {
      ...(departmentId ? { departmentId } : {}),
      ...(role ? { role: role as "EMPLOYEE" | "MANAGER" | "ADMIN" } : {}),
      ...(!includeInactive ? { isActive: true } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      employeeCode: true,
      role: true,
      isActive: true,
      designation: true,
      departmentId: true,
      managerId: true,
      department: { select: { id: true, name: true, code: true } },
      manager: { select: { id: true, name: true, employeeCode: true } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ users });
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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const data = parsed.data;
  const passwordHash = data.password
    ? await bcrypt.hash(data.password, 12)
    : await bcrypt.hash("password123", 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        employeeCode: data.employeeCode,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId,
        managerId: data.managerId,
        designation: data.designation,
      },
      select: {
        id: true,
        email: true,
        name: true,
        employeeCode: true,
        role: true,
        isActive: true,
        department: { select: { name: true } },
      },
    });
    return apiSuccess({ user }, 201);
  } catch {
    return apiError("User with this email or employee code already exists", 409);
  }
}
