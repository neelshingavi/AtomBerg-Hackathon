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
  Network,
  Radio,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingApprovalsCount } from "@/hooks/useGoals";
import { NAV_LABELS, PRODUCT } from "@/lib/brand";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

type NavSection = { title: string; items: NavItem[] };

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
    { href: "/employee", label: NAV_LABELS.employee.home, icon: LayoutDashboard },
    { href: "/employee/goals", label: NAV_LABELS.employee.goals, icon: Target },
    { href: "/employee/checkins", label: NAV_LABELS.employee.checkins, icon: ClipboardCheck },
    { href: "/employee/shared-goals", label: NAV_LABELS.employee.shared, icon: Share2 },
    { href: "/notifications", label: NAV_LABELS.employee.inbox, icon: Bell },
  ];

  const managerNav: NavItem[] = [
    { href: "/manager", label: NAV_LABELS.manager.home, icon: LayoutDashboard },
    {
      href: "/manager/approvals",
      label: NAV_LABELS.manager.approvals,
      icon: CheckSquare,
      badge: pendingCount,
    },
    { href: "/manager/team", label: NAV_LABELS.manager.team, icon: Users },
    { href: "/manager/activity", label: NAV_LABELS.manager.activity, icon: Activity },
    { href: "/manager/analytics", label: NAV_LABELS.manager.analytics, icon: TrendingUp },
    { href: "/manager/shared-goals", label: NAV_LABELS.manager.shared, icon: Share2 },
    { href: "/notifications", label: NAV_LABELS.manager.inbox, icon: Bell },
  ];

  const intelligenceNav: NavItem[] = [
    { href: "/admin/executive", label: NAV_LABELS.intelligence.executive, icon: Brain },
    { href: "/admin/briefing", label: NAV_LABELS.intelligence.briefing, icon: Sparkles },
    { href: "/admin/command-center", label: NAV_LABELS.intelligence.commandCenter, icon: Radio },
    { href: "/admin/alignment", label: NAV_LABELS.intelligence.alignment, icon: Network },
    { href: "/admin/forecast", label: NAV_LABELS.intelligence.forecast, icon: TrendingUp },
    { href: "/admin/collaboration", label: NAV_LABELS.intelligence.collaboration, icon: MessageSquare },
    { href: "/admin/activity", label: NAV_LABELS.intelligence.activity, icon: Activity },
    { href: "/admin/analytics", label: NAV_LABELS.intelligence.analytics, icon: BarChart3 },
    { href: "/admin/escalations", label: NAV_LABELS.intelligence.escalations, icon: AlertTriangle },
  ];

  const administrationNav: NavItem[] = [
    { href: "/admin", label: NAV_LABELS.intelligence.home, icon: LayoutDashboard },
    { href: "/admin/users", label: NAV_LABELS.administration.users, icon: Users },
    { href: "/admin/departments", label: NAV_LABELS.administration.departments, icon: Building2 },
    { href: "/admin/thrust-areas", label: NAV_LABELS.administration.thrustAreas, icon: Layers },
    { href: "/admin/cycles", label: NAV_LABELS.administration.cycles, icon: Calendar },
    { href: "/admin/shared-goals", label: NAV_LABELS.administration.shared, icon: Share2 },
    {
      href: "/admin/reports/achievement",
      label: NAV_LABELS.administration.achievement,
      icon: BarChart3,
    },
    {
      href: "/admin/reports/completion",
      label: NAV_LABELS.administration.completion,
      icon: ClipboardList,
    },
    { href: "/admin/automation", label: NAV_LABELS.administration.automation, icon: Zap },
    { href: "/admin/observability", label: NAV_LABELS.administration.observability, icon: Gauge },
    { href: "/admin/architecture", label: NAV_LABELS.administration.architecture, icon: Network },
    { href: "/admin/settings", label: NAV_LABELS.administration.integrations, icon: Settings },
    { href: "/admin/audit-log", label: NAV_LABELS.administration.audit, icon: FileText },
    { href: "/notifications", label: NAV_LABELS.administration.inbox, icon: Bell },
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
              <span className="relative z-10 flex-1 leading-tight">{item.label}</span>
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

  function renderSection(section: NavSection) {
    return (
      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
          {section.title}
        </p>
        {renderNav(section.items)}
      </div>
    );
  }

  const adminSections: NavSection[] = [
    { title: "Organizational Intelligence", items: intelligenceNav },
    { title: "Platform Administration", items: administrationNav },
  ];

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
            <p className="text-base font-bold tracking-tight text-white">{PRODUCT.name}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              {PRODUCT.tagline}
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
              Workforce Layer
            </p>
            {renderNav(employeeNav)}
          </div>
        )}

        {(role === "MANAGER" || role === "ADMIN") && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              Leadership Layer
            </p>
            {renderNav(managerNav)}
          </div>
        )}

        {role === "ADMIN" &&
          adminSections.map((section) => (
            <div key={section.title}>{renderSection(section)}</div>
          ))}
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
