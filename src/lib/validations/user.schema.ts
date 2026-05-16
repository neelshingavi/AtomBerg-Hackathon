import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  employeeCode: z.string().min(1).max(50),
  password: z.string().min(8).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
  departmentId: z.string().min(1),
  managerId: z.string().optional().nullable(),
  designation: z.string().max(200).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
    departmentId: z.string().min(1).optional(),
    managerId: z.string().optional().nullable(),
    designation: z.string().max(200).optional().nullable(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });
