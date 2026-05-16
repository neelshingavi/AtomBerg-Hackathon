import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: apiError("Unauthorized", 401) };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isActive: true, role: true },
  });

  if (!dbUser?.isActive) {
    return { session: null, error: apiError("Account is deactivated", 403) };
  }

  if (dbUser.role !== session.user.role) {
    session.user.role = dbUser.role;
  }

  return { session, error: null };
}

export function requireRoles(session: { user: { role: Role } }, roles: Role[]) {
  if (!roles.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }
  return null;
}
