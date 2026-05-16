"use client";

import Link from "next/link";
import {
  Users,
  AlertTriangle,
  Shield,
  FileCheck,
  Lock,
  Activity,
  Building2,
  BarChart3,
  Server,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { DashboardHero } from "@/components/dashboard/shared/DashboardHero";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerGrid, StaggerItem, MotionCard } from "@/components/motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const quickLinks = [
  { href: "/admin/executive", label: "Executive", icon: BarChart3, desc: "Org intelligence" },
  { href: "/admin/users", label: "Users", icon: Users, desc: "Accounts & roles" },
  { href: "/admin/departments", label: "Departments", icon: Building2, desc: "Org structure" },
  { href: "/admin/cycles", label: "Cycles", icon: FileCheck, desc: "FY windows" },
  { href: "/admin/reports/achievement", label: "Reports", icon: BarChart3, desc: "Exports" },
  { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle, desc: "Rules & logs" },
  { href: "/admin/audit-log", label: "Audit log", icon: Shield, desc: "Compliance" },
];

export function AdminDashboardView({
  orgCompletionPct,
  activeEscalations,
  delayedManagers,
  checkinCompliance,
  lockedGoals,
  unresolvedAudits,
  employees,
  managers,
  pendingApprovals,
  escalationTrend,
  systemHealth,
}: {
  orgCompletionPct: number;
  activeEscalations: number;
  delayedManagers: number;
  checkinCompliance: number;
  lockedGoals: number;
  unresolvedAudits: number;
  employees: number;
  managers: number;
  pendingApprovals: number;
  escalationTrend: { label: string; count: number }[];
  systemHealth: {
    activeUsers: number;
    apiHealth: "healthy" | "degraded";
    backgroundJobs: string;
    notifications: string;
  };
}) {
  const maxEsc = Math.max(...escalationTrend.map((e) => e.count), 1);

  return (
    <div className="space-y-8">
      <DashboardHero
        greeting="Executive overview"
        subtitle="Organization-wide governance, compliance monitoring, and system health."
        completionPct={orgCompletionPct}
        variant="admin"
      />

      <DashboardStats
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        items={[
          {
            label: "Org completion",
            value: `${orgCompletionPct}%`,
            icon: BarChart3,
            accent: orgCompletionPct >= 70 ? "success" : "warning",
            trend: orgCompletionPct >= 50 ? "up" : "down",
          },
          {
            label: "Active escalations",
            value: activeEscalations,
            icon: AlertTriangle,
            accent: activeEscalations > 0 ? "warning" : "success",
          },
          {
            label: "Delayed managers",
            value: delayedManagers,
            icon: Users,
            accent: delayedManagers > 0 ? "warning" : "success",
          },
          {
            label: "Check-in compliance",
            value: `${checkinCompliance}%`,
            icon: CheckCircle2,
            accent: checkinCompliance >= 80 ? "success" : "warning",
          },
          {
            label: "Locked goals",
            value: lockedGoals,
            icon: Lock,
            accent: "neutral",
          },
          {
            label: "Open audit items",
            value: unresolvedAudits,
            icon: Shield,
            accent: unresolvedAudits > 0 ? "warning" : "success",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card className="enterprise-card">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card">Escalation intelligence</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {escalationTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No escalation data.</p>
              ) : (
                escalationTrend.map((e) => (
                  <div key={e.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{e.label}</span>
                      <span className="font-medium tabular-nums">{e.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${(e.count / maxEsc) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn>
          <Card className="enterprise-card">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card flex items-center gap-2">
                <Server className="h-4 w-4" />
                System health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {[
                { label: "Active users (24h)", value: systemHealth.activeUsers, icon: Users },
                {
                  label: "API",
                  value: systemHealth.apiHealth,
                  icon: Activity,
                  badge: systemHealth.apiHealth === "healthy" ? "success" : "warning",
                },
                { label: "Background jobs", value: systemHealth.backgroundJobs, icon: Server },
                { label: "Notifications", value: systemHealth.notifications, icon: Bell },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  {typeof row.value === "number" ? (
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        row.badge === "success" && "border-success/30 text-success",
                        row.badge === "warning" && "border-warning/30 text-warning"
                      )}
                    >
                      {String(row.value)}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="enterprise-card p-5">
          <p className="type-label">Workforce</p>
          <p className="mt-1 text-2xl font-semibold">{employees}</p>
          <p className="type-caption">Active employees</p>
        </Card>
        <Card className="enterprise-card p-5">
          <p className="type-label">Leadership</p>
          <p className="mt-1 text-2xl font-semibold">{managers}</p>
          <p className="type-caption">Active managers</p>
        </Card>
        <Card className="enterprise-card p-5">
          <p className="type-label">Pending approvals</p>
          <p className="mt-1 text-2xl font-semibold">{pendingApprovals}</p>
          <Progress value={pendingApprovals > 0 ? 40 : 100} className="mt-3 h-1.5" />
        </Card>
      </div>

      <FadeIn>
        <h3 className="type-label mb-4">Governance quick access</h3>
        <StaggerGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <StaggerItem key={link.href}>
                <Link href={link.href}>
                  <MotionCard className="group flex items-start gap-4 rounded-lg border bg-card p-4 shadow-card hover:border-brand-200 hover:shadow-card-hover">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{link.label}</p>
                      <p className="type-caption">{link.desc}</p>
                    </div>
                  </MotionCard>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      </FadeIn>
    </div>
  );
}
