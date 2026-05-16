"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
  ClipboardCheck,
  Activity,
  TrendingUp,
  AlertTriangle,
  Settings,
  Sparkles,
  Brain,
  Bell,
  Zap,
  Gauge,
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
    { href: "/employee/checkins", label: "Check-ins", icon: ClipboardCheck },
    { href: "/employee/shared-goals", label: "Shared Goals", icon: Share2 },
    { href: "/notifications", label: "Inbox", icon: Bell },
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
    { href: "/manager/activity", label: "Activity Center", icon: Activity },
    { href: "/manager/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/manager/shared-goals", label: "Push Shared Goals", icon: Share2 },
    { href: "/notifications", label: "Inbox", icon: Bell },
  ];

  const adminNav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/executive", label: "Executive", icon: Brain },
    { href: "/admin/shared-goals", label: "Shared Goals", icon: Share2 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/activity", label: "Activity Center", icon: Activity },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/thrust-areas", label: "Thrust Areas", icon: Layers },
    { href: "/admin/cycles", label: "Cycles", icon: Calendar },
    { href: "/admin/reports/achievement", label: "Achievement Report", icon: BarChart3 },
    { href: "/admin/reports/completion", label: "Completion", icon: ClipboardList },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
    { href: "/admin/automation", label: "Automation", icon: Zap },
    { href: "/admin/observability", label: "Observability", icon: Gauge },
    { href: "/admin/settings", label: "Integrations", icon: Settings },
    { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
    { href: "/notifications", label: "Inbox", icon: Bell },
  ];

  function renderNav(items: NavItem[]) {
    return (
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "text-white"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-600/90 to-brand-500/80 shadow-inner-glow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-4 w-4 shrink-0 transition-transform duration-200",
                  active ? "text-white" : "group-hover:scale-110"
                )}
              />
              <span className="relative z-10 flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge
                  variant="secondary"
                  className="relative z-10 ml-auto border-0 bg-white/20 text-xs text-white"
                >
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
    <aside
      className={cn(
        "sidebar-gradient flex h-full w-64 flex-col border-r border-sidebar-border text-sidebar-foreground",
        className
      )}
    >
      <div className="border-b border-sidebar-border px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              Performance OS
            </p>
          </div>
        </div>
        {session?.user && (
          <div className="mt-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
            <p className="truncate text-sm font-medium text-white">{session.user.name}</p>
            <p className="font-mono text-[11px] text-sidebar-muted">
              {session.user.employeeCode}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-3 scrollbar-thin">
        {(role === "EMPLOYEE" || role === "MANAGER" || role === "ADMIN") && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Employee
            </p>
            {renderNav(employeeNav)}
          </div>
        )}

        {(role === "MANAGER" || role === "ADMIN") && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Manager
            </p>
            {renderNav(managerNav)}
          </div>
        )}

        {role === "ADMIN" && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Admin
            </p>
            {renderNav(adminNav)}
          </div>
        )}
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-muted hover:bg-white/10 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
