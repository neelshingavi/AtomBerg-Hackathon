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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/motion";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "@/lib/demo/config";

const azureEnabled = process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === "true";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

const ROLE_ICONS: Record<DemoRole, React.ElementType> = {
  EMPLOYEE: User,
  MANAGER: Briefcase,
  ADMIN: Shield,
  EXECUTIVE: Crown,
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
    form.setValue("email", account.email);
    form.setValue("password", DEMO_PASSWORD);
    setDemoLoading(role);
    try {
      await doSignIn(account.email, DEMO_PASSWORD, account.landingPath);
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <FadeIn>
      <Card className="shine-border border-0 shadow-card-hover backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Organizational Performance OS
              </CardTitle>
              <CardDescription className="text-sm">
                Sign in to {appName} ·{" "}
                <Link href="/welcome" className="text-brand-600 hover:underline">
                  Product overview
                </Link>
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wider">
            Demo-ready · 100+ seeded employees
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              One-click demo access
            </p>
            <StaggerGrid className="grid grid-cols-2 gap-2">
              {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => {
                const account = DEMO_ACCOUNTS[role];
                const Icon = ROLE_ICONS[role];
                return (
                  <StaggerItem key={role}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto w-full flex-col items-start gap-1 px-3 py-2.5 text-left hover:border-brand-500/40 hover:bg-brand-500/5"
                      disabled={loading || demoLoading !== null}
                      onClick={() => void quickDemo(role)}
                    >
                      <span className="flex w-full items-center gap-2">
                        {demoLoading === role ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4 text-brand-600" />
                        )}
                        <span className="font-medium">{account.label}</span>
                      </span>
                      <span className="text-[10px] leading-snug text-muted-foreground line-clamp-2">
                        {account.description}
                      </span>
                    </Button>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Password for all demo accounts:{" "}
              <span className="font-mono font-medium">{DEMO_PASSWORD}</span>
            </p>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium text-muted-foreground">
              or sign in with email
            </span>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="h-10 pl-9"
                  disabled={loading || demoLoading !== null}
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-10 pl-9"
                  disabled={loading || demoLoading !== null}
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}
            <Button
              type="submit"
              className="h-10 w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:from-brand-700 hover:to-brand-600"
              disabled={loading || demoLoading !== null}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {azureEnabled && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium text-muted-foreground">
                  enterprise SSO
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-2"
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
        </CardContent>
      </Card>
    </FadeIn>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
