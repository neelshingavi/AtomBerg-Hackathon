import { z } from "zod";

const dateField = z.coerce.date();

const cycleDateFields = {
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
};

function withCycleWindowRefinements<T extends z.ZodObject<typeof cycleDateFields>>(
  schema: T
) {
  return schema
    .refine((d) => d.goalSettingEnd > d.goalSettingStart, {
      message: "Goal setting end must be after start",
      path: ["goalSettingEnd"],
    })
    .refine((d) => d.q1WindowStart >= d.goalSettingEnd, {
      message: "Q1 window must start after goal setting closes",
      path: ["q1WindowStart"],
    })
    .refine((d) => d.q1WindowEnd > d.q1WindowStart, {
      message: "Q1 end must be after Q1 start",
      path: ["q1WindowEnd"],
    })
    .refine((d) => d.q2WindowStart >= d.q1WindowEnd, {
      message: "Q2 window must start after Q1 closes",
      path: ["q2WindowStart"],
    })
    .refine((d) => d.q2WindowEnd > d.q2WindowStart, {
      message: "Q2 end must be after Q2 start",
      path: ["q2WindowEnd"],
    })
    .refine((d) => d.q3WindowStart >= d.q2WindowEnd, {
      message: "Q3 window must start after Q2 closes",
      path: ["q3WindowStart"],
    })
    .refine((d) => d.q3WindowEnd > d.q3WindowStart, {
      message: "Q3 end must be after Q3 start",
      path: ["q3WindowEnd"],
    })
    .refine((d) => d.q4WindowStart >= d.q3WindowEnd, {
      message: "Q4 window must start after Q3 closes",
      path: ["q4WindowStart"],
    })
    .refine((d) => d.q4WindowEnd > d.q4WindowStart, {
      message: "Q4 end must be after Q4 start",
      path: ["q4WindowEnd"],
    });
}

export const createCycleSchema = withCycleWindowRefinements(z.object(cycleDateFields));

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
