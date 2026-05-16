import { z } from "zod";

export const escalationRuleSchema = z.object({
  trigger: z.enum(["GOAL_NOT_SUBMITTED", "GOAL_NOT_APPROVED", "CHECKIN_NOT_COMPLETED"]),
  daysThreshold: z.number().int().min(1).max(90),
  isActive: z.boolean().optional(),
  notifyEmployee: z.boolean().optional(),
  notifyManager: z.boolean().optional(),
  notifyHR: z.boolean().optional(),
  notifySkipLevel: z.boolean().optional(),
  cycleId: z.string().optional().nullable(),
});

export const updateEscalationRuleSchema = escalationRuleSchema.partial();
