import { prisma } from "@/lib/prisma";
import type { OperationalEventType, Prisma } from "@prisma/client";
import { bumpRealtimeVersion } from "./events";

export type PublishEventInput = {
  type: OperationalEventType;
  title: string;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  actorId?: string;
  departmentId?: string;
  entityType?: string;
  entityId?: string;
  href?: string;
  cycleId?: string;
  metadata?: Record<string, unknown>;
};

export async function publishOperationalEvent(input: PublishEventInput) {
  const event = await prisma.operationalEvent.create({
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      severity: input.severity ?? "low",
      actorId: input.actorId,
      departmentId: input.departmentId,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
      cycleId: input.cycleId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  await bumpRealtimeVersion(`event:${input.type}`);
  return event;
}
