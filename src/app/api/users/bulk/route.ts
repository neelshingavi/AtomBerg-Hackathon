import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userIds: z.array(z.string()).min(1).max(100),
  action: z.enum(["activate", "deactivate", "assign_department", "assign_manager"]),
  departmentId: z.string().optional(),
  managerId: z.string().nullable().optional(),
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

  const { userIds, action, departmentId, managerId } = parsed.data;
  const clientIp = getRequestIp(req);
  const updated: string[] = [];

  for (const userId of userIds) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;

    const data: Record<string, unknown> = {};
    if (action === "activate") data.isActive = true;
    if (action === "deactivate") data.isActive = false;
    if (action === "assign_department" && departmentId) data.departmentId = departmentId;
    if (action === "assign_manager") data.managerId = managerId ?? null;

    if (Object.keys(data).length === 0) continue;

    await prisma.user.update({ where: { id: userId }, data });

    await writeAuditLog({
      action: "UPDATED",
      entityType: "User",
      entityId: userId,
      createdById: session.user.id,
      affectedUserId: userId,
      previousValues: {
        isActive: user.isActive,
        departmentId: user.departmentId,
        managerId: user.managerId,
      },
      newValues: data,
      metadata: { bulk: true, action },
      ipAddress: clientIp,
    });

    updated.push(userId);
  }

  return apiSuccess({ updated, count: updated.length });
}
