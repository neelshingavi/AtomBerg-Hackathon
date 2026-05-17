"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  Crown,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "@/lib/demo/config";
import { useDemoModeOptional } from "@/contexts/DemoModeContext";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<DemoRole, React.ElementType> = {
  EMPLOYEE: User,
  MANAGER: Briefcase,
  ADMIN: Shield,
  EXECUTIVE: Crown,
};

export function RoleSwitcher({ className }: { className?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const demo = useDemoModeOptional();
  const [switching, setSwitching] = useState<DemoRole | null>(null);

  if (!demo?.enabled) return null;

  async function switchRole(role: DemoRole) {
    const account = DEMO_ACCOUNTS[role];
    setSwitching(role);
    try {
      const res = await signIn("credentials", {
        email: account.email,
        password: DEMO_PASSWORD,
        redirect: false,
      });
      if (!res?.error) {
        router.push(account.landingPath);
        router.refresh();
      }
    } finally {
      setSwitching(null);
    }
  }

  const currentRole = (session?.user?.role ?? "EMPLOYEE") as DemoRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 border-brand-500/30 bg-brand-500/5 text-brand-700 hover:bg-brand-500/10",
            className
          )}
          aria-label="Switch demo role"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Demo
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          Quick role switch
          <Badge variant="secondary" className="text-[10px]">
            LIVE
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((role) => {
          const account = DEMO_ACCOUNTS[role];
          const Icon = ROLE_ICONS[role];
          const isActive =
            role === "EXECUTIVE"
              ? currentRole === "ADMIN" && session?.user
              : currentRole === role;
          return (
            <DropdownMenuItem
              key={role}
              disabled={switching !== null}
              onClick={() => void switchRole(role)}
              className="flex flex-col items-start gap-0.5 py-2.5"
            >
              <div className="flex w-full items-center gap-2">
                {switching === role ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                ) : (
                  <Icon className="h-4 w-4 text-brand-600" />
                )}
                <span className="font-medium">{account.label}</span>
                {isActive && role !== "EXECUTIVE" && (
                  <Badge className="ml-auto text-[10px]" variant="outline">
                    Active
                  </Badge>
                )}
              </div>
              <span className="pl-6 text-xs text-muted-foreground">
                {account.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
