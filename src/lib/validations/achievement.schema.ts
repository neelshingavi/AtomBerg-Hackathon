import { z } from "zod";

export const quarterSchema = z.enum(["Q1", "Q2", "Q3", "Q4"]);

export const achievementInputSchema = z.object({
  goalId: z.string().min(1),
  quarter: quarterSchema,
  cycleId: z.string().min(1),
  actualValue: z.number().min(0, "Actual value must be non-negative").optional().nullable(),
  completionDate: z.coerce.date().optional().nullable(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "AT_RISK", "COMPLETED"]),
  remark: z.string().max(2000).optional().nullable(),
});

export const achievementBatchSchema = z.object({
  goalSheetId: z.string().min(1),
  quarter: quarterSchema,
  cycleId: z.string().min(1),
  achievements: z.array(
    z.object({
      goalId: z.string().min(1),
      actualValue: z.number().min(0, "Actual value must be non-negative").optional().nullable(),
      completionDate: z.coerce.date().optional().nullable(),
      status: z.enum(["NOT_STARTED", "ON_TRACK", "AT_RISK", "COMPLETED"]),
      remark: z.string().max(2000).optional().nullable(),
    })
  ),
});

export const checkinInputSchema = z.object({
  goalSheetId: z.string().min(1),
  quarter: quarterSchema,
  comment: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  isPrivate: z.boolean().optional(),
});
