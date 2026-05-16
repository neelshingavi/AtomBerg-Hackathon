import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { thrustAreaSchema } from "@/lib/validations/admin.schema";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const all = req.nextUrl.searchParams.get("all") === "true";

  const thrustAreas = await prisma.thrustArea.findMany({
    where: all ? {} : { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      departmentId: true,
      isActive: true,
      order: true,
    },
  });

  return apiSuccess({ thrustAreas });
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

  const parsed = thrustAreaSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const thrustArea = await prisma.thrustArea.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color ?? "#6366f1",
      order: parsed.data.order ?? 0,
      departmentId: parsed.data.departmentId,
    },
  });

  return apiSuccess({ thrustArea }, 201);
}
