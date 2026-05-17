import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { publishOperationalEvent } from "@/lib/realtime/publish";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const spaces = await prisma.collaborationSpace.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { name: true } },
      _count: { select: { posts: true, members: true } },
      posts: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  return apiSuccess({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      slug: s.slug,
      color: s.color,
      ownerName: s.owner.name,
      postCount: s._count.posts,
      memberCount: s._count.members,
      latestPost: s.posts[0]
        ? {
            body: s.posts[0].body.slice(0, 120),
            authorName: s.posts[0].author.name,
            postType: s.posts[0].postType,
            createdAt: s.posts[0].createdAt.toISOString(),
          }
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const rErr = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (rErr) return rErr;

  const body = await req.json();
  const name = body.name as string;
  if (!name?.trim()) return apiError("name required");

  const slug =
    (body.slug as string)?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const space = await prisma.collaborationSpace.create({
    data: {
      name: name.trim(),
      description: body.description,
      slug,
      ownerId: session.user.id,
      cycleId: body.cycleId,
      color: body.color ?? "#6366f1",
      members: { create: { userId: session.user.id, role: "owner" } },
    },
  });

  await publishOperationalEvent({
    type: "COLLABORATION",
    title: "Collaboration space created",
    description: name,
    actorId: session.user.id,
    severity: "low",
    href: `/admin/collaboration/${space.id}`,
  });

  return apiSuccess(space);
}
