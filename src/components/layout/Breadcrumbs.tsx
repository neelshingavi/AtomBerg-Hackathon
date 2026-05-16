"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
  goals: "Goals",
  new: "Create",
  checkin: "Check-in",
  checkins: "Check-ins",
  approvals: "Approvals",
  team: "Team",
  analytics: "Analytics",
  "shared-goals": "Shared goals",
  users: "Users",
  departments: "Departments",
  "thrust-areas": "Thrust areas",
  cycles: "Cycles",
  reports: "Reports",
  achievement: "Achievement",
  completion: "Completion",
  escalations: "Escalations",
  settings: "Settings",
  "audit-log": "Audit log",
};

function labelForSegment(segment: string, prev?: string): string {
  if (LABELS[segment]) return LABELS[segment];
  if (prev === "approvals" || prev === "goals") return "Sheet";
  if (prev === "team") return "Member";
  return segment.replace(/-/g, " ");
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const roleHome = `/${segments[0]}`;
  const crumbs: { href: string; label: string }[] = [{ href: roleHome, label: "Home" }];

  let path = "";
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const href = `${roleHome}${path}`;
    const looksLikeId =
      segment.length > 12 && !LABELS[segment] && /^[a-z0-9-]+$/i.test(segment);
    if (looksLikeId && i === segments.length - 1) continue;
    crumbs.push({
      href,
      label: labelForSegment(segment, segments[i - 1]),
    });
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      <Link
        href={roleHome}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          {i === crumbs.length - 2 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
