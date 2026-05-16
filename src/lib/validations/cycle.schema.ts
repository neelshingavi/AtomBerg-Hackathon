import { z } from "zod";

const dateField = z.coerce.date();

export const createCycleSchema = z.object({
  name: z.string().min(1).max(200),
  fiscalYear: z.string().min(1).max(20),
  isActive: z.boolean().optional(),
  goalSettingStart: dateField,
  goalSettingEnd: dateField,
  q1WindowStart: dateField,
  q1WindowEnd: dateField,
  q2WindowStart: dateField,
  q2WindowEnd: dateField,
  q3WindowStart: dateField,
  q3WindowEnd: dateField,
  q4WindowStart: dateField,
  q4WindowEnd: dateField,
});

export const updateCycleSchema = createCycleSchema.partial().extend({
  currentPhase: z
    .enum([
      "GOAL_SETTING",
      "Q1_CHECKIN",
      "Q2_CHECKIN",
      "Q3_CHECKIN",
      "Q4_ANNUAL",
      "CLOSED",
    ])
    .optional(),
});
