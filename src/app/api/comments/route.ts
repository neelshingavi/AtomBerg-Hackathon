import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { createComment, listComments } from "@/lib/comments/service";
import type { CommentEntityType } from "@prisma/client";

const createSchema = z.object({
  entityType: z.enum(["GOAL_SHEET", "GOAL", "CHECKIN", "ESCALATION"]),
  entityId: z.string(),
  goalSheetId: z.string().optional(),
  parentId: z.string().optional(),
  body: z.string().min(1).max(5000),
  isPrivate: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const entityType = req.nextUrl.searchParams.get("entityType") as CommentEntityType | null;
  const entityId = req.nextUrl.searchParams.get("entityId");
  const goalSheetId = req.nextUrl.searchParams.get("goalSheetId") ?? undefined;

  if (!entityType || !entityId) {
    return apiError("entityType and entityId required");
  }

  const comments = await listComments({ entityType, entityId, goalSheetId });
  return apiSuccess({ comments });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

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

  const comment = await createComment({
    ...parsed.data,
    authorId: session.user.id,
  });

  return apiSuccess({ comment });
}
