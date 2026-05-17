import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { publishOperationalEvent } from "@/lib/realtime/publish";
import type { CollaborationPostType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { error } = await requireSession();
  if (error) return error;
  const { spaceId } = await params;

  const space = await prisma.collaborationSpace.findUnique({
    where: { id: spaceId },
    include: {
      owner: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
      posts: {
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!space) return apiError("Space not found", 404);
  return apiSuccess(space);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { spaceId } = await params;

  const body = await req.json();
  const text = body.body as string;
  if (!text?.trim()) return apiError("body required");

  const postType = (body.postType as CollaborationPostType) ?? "DISCUSSION";

  const post = await prisma.collaborationPost.create({
    data: {
      spaceId,
      authorId: session.user.id,
      body: text.trim(),
      postType,
    },
    include: { author: { select: { name: true } } },
  });

  await prisma.collaborationSpace.update({
    where: { id: spaceId },
    data: { updatedAt: new Date() },
  });

  await publishOperationalEvent({
    type: "INITIATIVE_UPDATE",
    title: `${postType} in collaboration space`,
    description: text.slice(0, 140),
    actorId: session.user.id,
    severity: postType === "BLOCKER" ? "high" : "low",
    href: `/admin/collaboration/${spaceId}`,
  });

  return apiSuccess(post);
}
