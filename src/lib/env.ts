import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validated: Env | null = null;

export function validateEnv(): Env {
  if (validated) return validated;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Environment validation failed: ${missing}`);
  }

  if (!result.data.AUTH_SECRET && !result.data.NEXTAUTH_SECRET) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required");
  }

  validated = result.data;
  return validated;
}

export function getEnvSafe(): Partial<Env> {
  const result = envSchema.safeParse(process.env);
  return result.success ? result.data : {};
}
