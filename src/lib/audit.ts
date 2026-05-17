import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

type AuditDbClient = Pick<typeof prisma, "auditLog">;

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  createdById: string;
  affectedUserId?: string;
  goalSheetId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditEntry, db: AuditDbClient = prisma) {
  return db.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      createdById: entry.createdById,
      affectedUserId: entry.affectedUserId,
      goalSheetId: entry.goalSheetId,
      previousValues: entry.previousValues as Prisma.InputJsonValue | undefined,
      newValues: entry.newValues as Prisma.InputJsonValue | undefined,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      ipAddress: entry.ipAddress,
    },
  });
}

export function createDiff(
  previous: Record<string, unknown>,
  current: Record<string, unknown>
): { prev: Record<string, unknown>; next: Record<string, unknown> } {
  const changedKeys = Object.keys(current).filter(
    (key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key])
  );
  const prev: Record<string, unknown> = {};
  const next: Record<string, unknown> = {};
  for (const key of changedKeys) {
    prev[key] = previous[key];
    next[key] = current[key];
  }
  return { prev, next };
}
