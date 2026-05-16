import { apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  const cycle = await getActiveCycle();

  const reports = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(session.user.role === "MANAGER" ? { managerId: session.user.id } : {}),
      role: "EMPLOYEE",
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      email: true,
      department: { select: { name: true } },
      goalSheets: cycle
        ? {
            where: { cycleId: cycle.id },
            select: {
              id: true,
              status: true,
              isLocked: true,
              goals: {
                select: {
                  id: true,
                  achievements: { select: { quarter: true, status: true } },
                },
              },
            },
          }
        : false,
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ cycle, team: reports });
}
