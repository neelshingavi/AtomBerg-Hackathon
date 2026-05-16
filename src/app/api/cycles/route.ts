import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { getActiveCycle, getCurrentPhase, isQuarterWindowOpen } from "@/lib/cycle";
import { createCycleSchema } from "@/lib/validations/cycle.schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const active = await getActiveCycle();
  const cycles = await prisma.goalCycle.findMany({ orderBy: { createdAt: "desc" } });

  const enrich = (c: NonNullable<typeof active>) => ({
    ...c,
    computedPhase: getCurrentPhase(c),
    quarterWindows: {
      Q1: isQuarterWindowOpen(c, "Q1"),
      Q2: isQuarterWindowOpen(c, "Q2"),
      Q3: isQuarterWindowOpen(c, "Q3"),
      Q4: isQuarterWindowOpen(c, "Q4"),
    },
  });

  return apiSuccess({
    active: active ? enrich(active) : null,
    cycles: cycles.map((c) => enrich(c)),
  });
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
    return apiError("Invalid JSON body");
  }

  const parsed = createCycleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const data = parsed.data;

  const cycle = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.goalCycle.updateMany({ data: { isActive: false } });
    }

    const created = await tx.goalCycle.create({
      data: {
        name: data.name,
        fiscalYear: data.fiscalYear,
        isActive: data.isActive ?? false,
        goalSettingStart: data.goalSettingStart,
        goalSettingEnd: data.goalSettingEnd,
        q1WindowStart: data.q1WindowStart,
        q1WindowEnd: data.q1WindowEnd,
        q2WindowStart: data.q2WindowStart,
        q2WindowEnd: data.q2WindowEnd,
        q3WindowStart: data.q3WindowStart,
        q3WindowEnd: data.q3WindowEnd,
        q4WindowStart: data.q4WindowStart,
        q4WindowEnd: data.q4WindowEnd,
      },
    });

    if (created.isActive) {
      await tx.systemConfig.upsert({
        where: { key: "active_cycle_id" },
        update: { value: created.id },
        create: { key: "active_cycle_id", value: created.id },
      });
    }

    return created;
  });

  return apiSuccess({ cycle }, 201);
}
