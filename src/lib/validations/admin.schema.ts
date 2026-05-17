import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const thrustAreaSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  order: z.number().int().optional(),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const unlockSheetSchema = z.object({
  reason: z.string().max(2000).optional(),
});
