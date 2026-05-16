import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { AutomationTrigger, Prisma } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.enum([
    "GOAL_SUBMITTED",
    "APPROVAL_DELAYED",
    "CHECKIN_MISSED",
    "HIGH_RISK",
    "COMPLETION_MILESTONE",
    "INACTIVE_EMPLOYEE",
  ]),
  conditions: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).min(1),
  delayMinutes: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  const rules = await prisma.automationRule.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });
  return apiSuccess({ rules });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN"]);
  if (roleError) return roleError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const rule = await prisma.automationRule.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      trigger: parsed.data.trigger as AutomationTrigger,
      conditions: (parsed.data.conditions ?? {}) as Prisma.InputJsonValue,
      actions: parsed.data.actions as Prisma.InputJsonValue,
      delayMinutes: parsed.data.delayMinutes ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return apiSuccess({ rule });
}
