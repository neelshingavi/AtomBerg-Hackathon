import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { getActiveQuarter, getCurrentPhase } from "@/lib/cycle";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const cycleId =
    req.nextUrl.searchParams.get("cycleId") ??
    (await prisma.systemConfig.findUnique({ where: { key: "active_cycle_id" } }))
      ?.value;

  if (!cycleId) return apiError("cycleId is required");

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return apiError("Cycle not found", 404);

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, name: true, departmentId: true, managerId: true },
  });

  const sheets = await prisma.goalSheet.findMany({
    where: { cycleId },
    include: {
      goals: { include: { achievements: true } },
      checkinComments: true,
    },
  });

  const totalEmployees = employees.length;
  const submitted = sheets.filter((s) =>
    ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(s.status)
  ).length;
  const approved = sheets.filter((s) => s.status === "APPROVED").length;
  const pending = totalEmployees - submitted;

  const activeQuarter = getActiveQuarter(cycle);
  const approvedSheets = sheets.filter((s) => s.status === "APPROVED");

  let employeesUpdated = 0;
  let managersCheckedIn = 0;

  if (activeQuarter) {
    employeesUpdated = approvedSheets.filter((s) =>
      s.goals.some((g) =>
        g.achievements.some(
          (a) => a.quarter === activeQuarter && a.actualValue != null
        )
      )
    ).length;

    const managerIds = new Set(
      approvedSheets
        .filter((s) => s.checkinComments.some((c) => c.quarter === activeQuarter))
        .map((s) => s.managerId)
        .filter(Boolean)
    );
    managersCheckedIn = managerIds.size;
  }

  const departmentMap = new Map<
    string,
    { name: string; total: number; approved: number }
  >();

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  for (const dept of departments) {
    const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
    const deptApproved = sheets.filter(
      (s) =>
        s.status === "APPROVED" &&
        deptEmployees.some((e) => e.id === s.employeeId)
    ).length;
    departmentMap.set(dept.id, {
      name: dept.name,
      total: deptEmployees.length,
      approved: deptApproved,
    });
  }

  const byDepartment = Array.from(departmentMap.values()).map((d) => ({
    department: d.name,
    totalEmployees: d.total,
    approved: d.approved,
    completionRate: d.total ? Math.round((d.approved / d.total) * 100) : 0,
  }));

  const managerUsers = await prisma.user.findMany({
    where: { role: "MANAGER", isActive: true },
    select: { id: true, name: true },
  });

  const byManager = managerUsers.map((mgr) => {
    const team = employees.filter((e) => e.managerId === mgr.id);
    const teamApproved = sheets.filter(
      (s) => s.status === "APPROVED" && team.some((e) => e.id === s.employeeId)
    ).length;
    return {
      manager: mgr.name,
      totalReports: team.length,
      approved: teamApproved,
      completionRate: team.length
        ? Math.round((teamApproved / team.length) * 100)
        : 0,
    };
  });

  const quarterKey = activeQuarter
    ? (`${activeQuarter}Checkin` as const)
    : null;

  return apiSuccess({
    cycle: { name: cycle.name, currentPhase: getCurrentPhase(cycle) },
    goalSetting: {
      totalEmployees,
      submitted,
      approved,
      pending,
      submissionRate: totalEmployees
        ? Math.round((submitted / totalEmployees) * 100)
        : 0,
      approvalRate: submitted ? Math.round((approved / submitted) * 100) : 0,
    },
    ...(quarterKey
      ? {
          [quarterKey]: {
            totalApproved: approvedSheets.length,
            employeesUpdated,
            managersCheckedIn,
            completionRate: approvedSheets.length
              ? Math.round((employeesUpdated / approvedSheets.length) * 100)
              : 0,
          },
        }
      : {}),
    byDepartment,
    byManager,
  });
}
