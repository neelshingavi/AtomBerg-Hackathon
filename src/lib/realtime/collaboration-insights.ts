import { prisma } from "@/lib/prisma";
import type { CollaborationInsight } from "./types";

export async function generateCollaborationInsights(cycleId?: string): Promise<CollaborationInsight[]> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [commentsByDept, submissions, spaces] = await Promise.all([
    prisma.discussionComment.groupBy({
      by: ["authorId"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.goalSheet.count({
      where: {
        submittedAt: { gte: since },
        ...(cycleId ? { cycleId } : {}),
      },
    }),
    prisma.collaborationSpace.count({ where: { isActive: true } }),
  ]);

  const authorIds = commentsByDept.map((c) => c.authorId);
  const authors =
    authorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true, department: { select: { name: true } } },
        })
      : [];

  const deptCounts = new Map<string, number>();
  for (const row of commentsByDept) {
    const user = authors.find((a) => a.id === row.authorId);
    const dept = user?.department?.name ?? "Unknown";
    deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + row._count.id);
  }

  const insights: CollaborationInsight[] = [];

  const sorted = Array.from(deptCounts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted[0]) {
    insights.push({
      id: "top-collab",
      title: `${sorted[0][0]} leads collaboration activity`,
      body: `${sorted[0][1]} discussion contributions in the last 14 days.`,
      trend: "positive",
      metric: String(sorted[0][1]),
    });
  }

  const low = sorted.filter(([, c]) => c <= 1);
  if (low.length >= 2) {
    insights.push({
      id: "isolated-teams",
      title: "Cross-functional collaboration gaps detected",
      body: `${low.map(([d]) => d).join(", ")} show reduced discussion density — review coordination.`,
      trend: "warning",
    });
  }

  if (submissions > 0 && commentsByDept.length < 3) {
    insights.push({
      id: "low-engagement",
      title: "Manager feedback lagging submissions",
      body: `${submissions} submissions vs limited threaded discussions — encourage inline goal dialogue.`,
      trend: "warning",
    });
  }

  insights.push({
    id: "spaces-active",
    title: `${spaces} initiative collaboration spaces active`,
    body: "Strategic initiative rooms are coordinating blockers, decisions, and live updates.",
    trend: "positive",
  });

  return insights.slice(0, 5);
}
