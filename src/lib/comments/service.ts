import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { createEnhancedNotification } from "@/lib/notifications/enhanced";
import { bumpRealtimeVersion } from "@/lib/realtime/events";
import type { CommentEntityType } from "@prisma/client";

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

function parseMentions(body: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = MENTION_REGEX.exec(body)) !== null) {
    ids.push(match[2]);
  }
  return Array.from(new Set(ids));
}

export async function listComments(params: {
  entityType: CommentEntityType;
  entityId: string;
  goalSheetId?: string;
}) {
  return prisma.discussionComment.findMany({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      parentId: null,
    },
    include: {
      author: { select: { id: true, name: true, employeeCode: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, employeeCode: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(params: {
  entityType: CommentEntityType;
  entityId: string;
  goalSheetId?: string;
  parentId?: string;
  authorId: string;
  body: string;
  isPrivate?: boolean;
}) {
  const mentionIds = parseMentions(params.body);

  const comment = await prisma.discussionComment.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      goalSheetId: params.goalSheetId,
      parentId: params.parentId,
      authorId: params.authorId,
      body: params.body,
      mentions: mentionIds.length ? mentionIds : undefined,
      isPrivate: params.isPrivate ?? false,
    },
    include: {
      author: { select: { id: true, name: true, employeeCode: true } },
    },
  });

  const author = comment.author;

  for (const userId of mentionIds) {
    if (userId === params.authorId) continue;
    await createEnhancedNotification({
      userId,
      type: "MENTION",
      title: `${author.name} mentioned you`,
      message: params.body.slice(0, 120),
      link: params.goalSheetId
        ? `/employee/goals/${params.goalSheetId}`
        : undefined,
      category: "COMMENT",
      priority: "MEDIUM",
      entityType: params.entityType,
      entityId: params.entityId,
    });
  }

  if (params.goalSheetId) {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: params.goalSheetId },
      select: { employeeId: true, managerId: true },
    });
    if (sheet?.managerId && sheet.managerId !== params.authorId) {
      await createEnhancedNotification({
        userId: sheet.managerId,
        type: "COMMENT",
        title: "New discussion comment",
        message: `${author.name}: ${params.body.slice(0, 100)}`,
        link: `/manager/approvals/${params.goalSheetId}`,
        category: "COMMENT",
        entityType: params.entityType,
        entityId: params.entityId,
      });
    }
  }

  await writeAuditLog({
    action: "COMMENT_ADDED",
    entityType: params.entityType,
    entityId: params.entityId,
    createdById: params.authorId,
    goalSheetId: params.goalSheetId,
    newValues: { body: params.body, parentId: params.parentId },
  });

  await bumpRealtimeVersion("comment");
  return comment;
}
