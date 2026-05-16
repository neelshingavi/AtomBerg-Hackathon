"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Target,
  Users,
  CheckSquare,
  Share2,
  FileText,
  LogOut,
  Building2,
  Layers,
  Calendar,
  BarChart3,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingApprovalsCount } from "@/hooks/useGoals";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
} = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { data: pendingCount } = usePendingApprovalsCount();

  const employeeNav: NavItem[] = [
    { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/goals", label: "My Goals", icon: Target },
    { href: "/employee/shared-goals", label: "Shared Goals", icon: Share2 },
  ];

  const managerNav: NavItem[] = [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/manager/approvals",
      label: "Approvals",
      icon: CheckSquare,
      badge: pendingCount,
    },
    { href: "/manager/team", label: "My Team", icon: Users },
    { href: "/manager/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/manager/shared-goals", label: "Push Shared Goals", icon: Share2 },
  ];

  const adminNav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/shared-goals", label: "Shared Goals", icon: Share2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/thrust-areas", label: "Thrust Areas", icon: Layers },
    { href: "/admin/cycles", label: "Cycles", icon: Calendar },
    { href: "/admin/reports/achievement", label: "Achievement Report", icon: BarChart3 },
    { href: "/admin/reports/completion", label: "Completion", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
    { href: "/admin/settings", label: "Integrations", icon: Settings },
    { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
  ];

  function renderNav(items: NavItem[]) {
    return (
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500/10 text-brand-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className={cn("flex h-full w-60 flex-col border-r bg-card", className)}>
      <div className="border-b px-4 py-5">
        <p className="text-lg font-bold text-brand-700">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"}
        </p>
        {session?.user && (
          <div className="mt-3 text-sm">
            <p className="font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{session.user.employeeCode}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {(role === "EMPLOYEE" || role === "MANAGER" || role === "ADMIN") && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Employee
            </p>
            {renderNav(employeeNav)}
          </div>
        )}

        {(role === "MANAGER" || role === "ADMIN") && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Manager
            </p>
            {renderNav(managerNav)}
          </div>
        )}

        {role === "ADMIN" && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase text-muted-foreground">Admin</p>
            {renderNav(adminNav)}
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
