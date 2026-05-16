import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  logIds: z.array(z.string()).min(1).max(50),
  action: z.enum(["resolve", "mark_reviewed"]),
  resolvedNote: z.string().optional(),
  managerId: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { logIds, action, resolvedNote, managerId } = parsed.data;

  const data =
    action === "resolve"
      ? {
          status: "RESOLVED" as const,
          resolvedAt: new Date(),
          resolvedNote: resolvedNote ?? "Bulk resolved by admin",
        }
      : { status: "ESCALATED" as const };

  const result = await prisma.escalationLog.updateMany({
    where: { id: { in: logIds } },
    data: {
      ...data,
      ...(managerId ? { managerId } : {}),
    },
  });

  return apiSuccess({ updated: result.count });
}
