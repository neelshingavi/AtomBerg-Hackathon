"use client";

import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

const ROLE_HINTS: Record<string, string> = {
  EMPLOYEE:
    "Submit your goal sheet early to improve alignment scores and reduce quarter-end escalations.",
  MANAGER:
    "Review pending approvals within 48 hours — approval velocity directly impacts org health metrics.",
  ADMIN:
    "Use Command Center and Executive Briefing for a live view of organizational execution health.",
};

const ROLE_ACTIONS: Record<
  string,
  { label: string; href: string } | undefined
> = {
  EMPLOYEE: { label: "Create goal sheet", href: "/employee/goals/new" },
  MANAGER: { label: "Open approval queue", href: "/manager/approvals" },
  ADMIN: { label: "Open command center", href: "/admin/command-center" },
};

export function SmartEmptyState({
  icon,
  title,
  description,
  aiSuggestion,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  aiSuggestion?: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "EMPLOYEE";
  const hint = aiSuggestion ?? ROLE_HINTS[role];
  const action = ROLE_ACTIONS[role];

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      hint={hint}
      className={className}
      action={
        action ? (
          <Link
            href={action.href}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            {action.label}
          </Link>
        ) : undefined
      }
    />
  );
}
