import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: apiError("Unauthorized", 401) };
  }
  return { session, error: null };
}

export function requireRoles(session: { user: { role: Role } }, roles: Role[]) {
  if (!roles.includes(session.user.role)) {
    return apiError("Forbidden", 403);
  }
  return null;
}
