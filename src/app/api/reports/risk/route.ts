import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/cycle";
import {
  computeEmployeeRisks,
  computeDepartmentRisks,
  computeManagerRisks,
} from "@/lib/risk/engine";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const cycleId =
    req.nextUrl.searchParams.get("cycleId") ?? (await getActiveCycle())?.id;

  if (!cycleId) return apiError("cycleId is required");

  const departmentId = req.nextUrl.searchParams.get("departmentId") ?? undefined;
  const managerId =
    session.user.role === "MANAGER"
      ? session.user.id
      : req.nextUrl.searchParams.get("managerId") ?? undefined;

  const [employees, departments, managers] = await Promise.all([
    computeEmployeeRisks({ cycleId, departmentId, managerId, limit: 30 }),
    session.user.role === "ADMIN"
      ? computeDepartmentRisks(cycleId)
      : Promise.resolve([]),
    session.user.role === "ADMIN"
      ? computeManagerRisks(cycleId)
      : Promise.resolve([]),
  ]);

  const distribution = {
    healthy: employees.filter((e) => e.level === "healthy").length,
    warning: employees.filter((e) => e.level === "warning").length,
    critical: employees.filter((e) => e.level === "critical").length,
  };

  return apiSuccess({
    employees,
    departments,
    managers,
    distribution,
  });
}
