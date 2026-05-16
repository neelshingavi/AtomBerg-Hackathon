import { z } from "zod";

export const uomTypeSchema = z.enum([
  "NUMERIC_MIN",
  "NUMERIC_MAX",
  "PERCENTAGE_MIN",
  "PERCENTAGE_MAX",
  "TIMELINE",
  "ZERO_BASED",
]);

export const goalInputSchema = z.object({
  thrustAreaId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  uomType: uomTypeSchema,
  plannedTarget: z.number(),
  targetDeadline: z.coerce.date().optional().nullable(),
  unit: z.string().max(100).optional(),
  weightage: z.number().min(10).max(100),
});

export const createGoalSheetSchema = z.object({
  cycleId: z.string().min(1),
  /** Admin only: create a sheet on behalf of another employee */
  employeeId: z.string().min(1).optional(),
  goals: z.array(goalInputSchema).min(1).max(8),
});

export const patchGoalSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(2000).optional().nullable(),
    uomType: uomTypeSchema.optional(),
    plannedTarget: z.number().optional(),
    targetDeadline: z.coerce.date().optional().nullable(),
    unit: z.string().max(100).optional().nullable(),
    weightage: z.number().min(10).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export const approveSheetSchema = z.object({
  managerNote: z.string().max(2000).optional(),
  inlineEdits: z
    .array(
      z.object({
        goalId: z.string().min(1),
        weightage: z.number().min(10).max(100).optional(),
        plannedTarget: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

export const rejectSheetSchema = z.object({
  managerNote: z.string().min(1).max(2000),
});

export const sharedGoalPushSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  uomType: uomTypeSchema,
  plannedTarget: z.number(),
  targetDeadline: z.coerce.date().optional().nullable(),
  unit: z.string().max(100).optional(),
  thrustAreaId: z.string().min(1),
  cycleId: z.string().min(1),
  targetEmployeeIds: z.array(z.string().min(1)).min(1),
  defaultWeightage: z.number().min(10).max(100),
});
