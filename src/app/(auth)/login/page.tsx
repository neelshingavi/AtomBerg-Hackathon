"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  Lock,
  Mail,
  User,
  Briefcase,
  Shield,
  Crown,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "@/lib/demo/config";
import { cn } from "@/lib/utils";

const azureEnabled = process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === "true";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

const DEMO_ROLES: DemoRole[] = ["EMPLOYEE", "MANAGER", "ADMIN", "EXECUTIVE"];

const ROLE_META: Record<
  DemoRole,
  { icon: React.ElementType; accent: string }
> = {
  EMPLOYEE: { icon: User, accent: "hover:border-sky-500/40 hover:bg-sky-500/5" },
  MANAGER: { icon: Briefcase, accent: "hover:border-violet-500/40 hover:bg-violet-500/5" },
  ADMIN: { icon: Shield, accent: "hover:border-brand-500/40 hover:bg-brand-500/5" },
  EXECUTIVE: { icon: Crown, accent: "hover:border-amber-500/40 hover:bg-amber-500/5" },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<DemoRole | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  async function doSignIn(email: string, password: string, landingPath?: string) {
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      return false;
    }
    router.replace(landingPath ?? callbackUrl);
    router.refresh();
    return true;
  }

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      await doSignIn(data.email, data.password);
    } finally {
      setLoading(false);
    }
  }

  async function quickDemo(role: DemoRole) {
    const account = DEMO_ACCOUNTS[role];
    setDemoLoading(role);
    try {
      await doSignIn(account.email, DEMO_PASSWORD, account.landingPath);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="w-full">
      {/* Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-xl shadow-slate-900/5">
        {/* Header — centered, stacked */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 shadow-lg shadow-brand-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign in to {appName}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Organizational performance operating system
          </p>
          <p className="mt-3 inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Demo-ready · 100+ employees seeded
          </p>
        </div>

        {/* Demo access */}
        <div className="mt-8">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            One-click demo
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ROLES.map((role) => {
              const account = DEMO_ACCOUNTS[role];
              const { icon: Icon, accent } = ROLE_META[role];
              const busy = demoLoading === role;
              return (
                <button
                  key={role}
                  type="button"
                  disabled={loading || demoLoading !== null}
                  onClick={() => void quickDemo(role)}
                  className={cn(
                    "group flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-3 text-center transition-all",
                    "disabled:pointer-events-none disabled:opacity-50",
                    accent
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-brand-600 transition-transform group-hover:scale-110" />
                  )}
                  <span className="text-sm font-semibold leading-none">{account.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            All accounts use password{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
              {DEMO_PASSWORD}
            </code>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <p className="relative mx-auto w-fit bg-card px-3 text-xs font-medium text-muted-foreground">
            or sign in with email
          </p>
        </div>

        {/* Email form */}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="h-11 pl-9"
                disabled={loading || demoLoading !== null}
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 pl-9"
                disabled={loading || demoLoading !== null}
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            className="h-11 w-full gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:from-brand-700 hover:to-brand-600"
            disabled={loading || demoLoading !== null}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {azureEnabled && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <p className="relative mx-auto w-fit bg-card px-3 text-xs font-medium text-muted-foreground">
                Enterprise SSO
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2"
              disabled={loading}
              onClick={() => signIn("azure-ad", { callbackUrl })}
            >
              <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden>
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Microsoft Azure AD
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-card p-8 shadow-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
