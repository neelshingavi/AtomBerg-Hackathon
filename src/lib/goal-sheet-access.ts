import type { Role } from "@prisma/client";

type SessionUser = { id: string; role: Role };

type GoalSheetRef = { employeeId: string; managerId: string | null };

/** Returns true if the user may read or mutate this goal sheet (role-based). */
export function canAccessGoalSheet(
  user: SessionUser,
  sheet: GoalSheetRef
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "EMPLOYEE" && sheet.employeeId === user.id) return true;
  if (user.role === "MANAGER" && sheet.managerId === user.id) return true;
  return false;
}
