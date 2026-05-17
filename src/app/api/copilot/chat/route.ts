import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildIntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import { computeOrganizationPulse } from "@/lib/health-engine";
import { buildCopilotContext } from "@/lib/ai/context-builder";
import { generateCopilotResponse } from "@/lib/ai/responder";
import { classifyQuery } from "@/lib/ai/query-router";
import { buildPredictiveSnapshot } from "@/lib/predictive-engine";
import { logAiGeneration } from "@/lib/ai/audit";
import { streamOpenAIText } from "@/lib/ai/openai";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  cycleId: z.string().optional(),
  stream: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return apiError("Invalid request body");

  let cycleId = parsed.data.cycleId;
  if (!cycleId) {
    const active = await prisma.systemConfig.findUnique({
      where: { key: "active_cycle_id" },
    });
    cycleId = active?.value ?? undefined;
  }
  if (!cycleId) return apiError("cycleId is required");

  const intent = classifyQuery(parsed.data.message);
  const needsPredictive =
    intent.startsWith("predictive_") ||
    /\b(predict|forecast|likely|proactive|next quarter)\b/i.test(parsed.data.message);

  const [snapshot, pulse, predictive] = await Promise.all([
    buildIntelligenceSnapshot(cycleId),
    computeOrganizationPulse(cycleId),
    needsPredictive ? buildPredictiveSnapshot(cycleId) : Promise.resolve(undefined),
  ]);

  const contextText = buildCopilotContext({
    snapshot,
    pulse,
    role: session.user.role,
    predictive,
  });

  if (parsed.data.stream && process.env.OPENAI_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await generateCopilotResponse({
            message: parsed.data.message,
            snapshot,
            pulse,
            contextText,
            predictive,
          });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "structured", data: response })}\n\n`)
          );
          for await (const chunk of streamOpenAIText(parsed.data.message, contextText)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", data: chunk })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error" })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const response = await generateCopilotResponse({
    message: parsed.data.message,
    snapshot,
    pulse,
    contextText,
    predictive,
  });

  void logAiGeneration({
    type: "copilot_response",
    userId: session.user.id,
    cycleId,
    prompt: parsed.data.message,
    summary: response.summary,
    confidence: response.confidence,
    metadata: { urgency: response.urgency, intent: "copilot" },
  });

  return apiSuccess({ response, cycleId, cycleName: snapshot.cycleName });
}
