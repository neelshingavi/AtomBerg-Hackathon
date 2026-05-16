import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 50)));

  const logs = await prisma.escalationLog.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "NOTIFIED" | "RESOLVED" | "ESCALATED" } : {}),
      ...(session.user.role === "MANAGER"
        ? { managerId: session.user.id }
        : {}),
    },
    include: {
      employee: { select: { name: true, employeeCode: true, email: true } },
      manager: { select: { name: true } },
      rule: { select: { trigger: true, daysThreshold: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return apiSuccess({ logs });
}
