import { NextRequest } from "next/server";
import type { AuditAction, Prisma } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const skip = (page - 1) * limit;

  const goalSheetId = searchParams.get("goalSheetId") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const action = (searchParams.get("action") as AuditAction | null) ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let where: Prisma.AuditLogWhereInput = {
    ...(goalSheetId ? { goalSheetId } : {}),
    ...(action ? { action } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  if (session.user.role === "ADMIN") {
    if (userId) where = { ...where, affectedUserId: userId };
  } else if (session.user.role === "EMPLOYEE") {
    where = {
      ...where,
      OR: [
        { affectedUserId: session.user.id },
        { goalSheet: { employeeId: session.user.id } },
      ],
    };
  } else if (session.user.role === "MANAGER") {
    where = {
      ...where,
      goalSheet: {
        managerId: session.user.id,
        ...(userId ? { employeeId: userId } : {}),
      },
    };
  } else {
    return apiError("Forbidden", 403);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        affectedUser: { select: { id: true, name: true } },
        goalSheet: {
          select: {
            id: true,
            employee: { select: { name: true, employeeCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return apiSuccess({
    logs,
    pagination: { page, limit, total },
  });
}
