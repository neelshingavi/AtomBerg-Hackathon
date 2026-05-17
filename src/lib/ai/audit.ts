import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AiAuditType =
  | "copilot_response"
  | "insight_generated"
  | "recommendation"
  | "anomaly"
  | "briefing"
  | "health_pulse";

export async function logAiGeneration(params: {
  type: AiAuditType;
  userId?: string;
  cycleId?: string;
  prompt?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}) {
  try {
    await prisma.aiIntelligenceLog.create({
      data: {
        type: params.type,
        userId: params.userId,
        cycleId: params.cycleId,
        prompt: params.prompt?.slice(0, 2000),
        summary: params.summary.slice(0, 4000),
        confidence: params.confidence,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch {
    /* table may not exist until migrate */
  }
}
