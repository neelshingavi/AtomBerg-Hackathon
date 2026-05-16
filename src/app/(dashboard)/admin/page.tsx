import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PageHeader } from "@/components/ui/page-header";
import { Users, UserCog, Clock, Building2, Calendar, BarChart3, Layers } from "lucide-react";
import { StaggerGrid, StaggerItem, FadeIn } from "@/components/motion";
import { MotionCard } from "@/components/motion";
import Link from "next/link";

const quickLinks = [
  { href: "/admin/users", label: "Users", icon: Users, desc: "Manage accounts & roles" },
  { href: "/admin/departments", label: "Departments", icon: Building2, desc: "Org structure" },
  { href: "/admin/cycles", label: "Cycles", icon: Calendar, desc: "FY windows & phases" },
  { href: "/admin/reports/achievement", label: "Reports", icon: BarChart3, desc: "Export achievements" },
  { href: "/admin/thrust-areas", label: "Thrust areas", icon: Layers, desc: "Strategic pillars" },
  { href: "/admin/audit-log", label: "Audit log", icon: Clock, desc: "Compliance trail" },
];

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [employees, managers, pending] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
    prisma.user.count({ where: { role: "MANAGER", isActive: true } }),
    prisma.goalSheet.count({ where: { status: "SUBMITTED" } }),
  ]);

  return (
    <>
      <Topbar title="Admin dashboard" />
      <PageContainer>
        <PageHeader
          title="Organization control"
          description="Configure cycles, manage users, and monitor goal completion across Atomberg."
        />

        <DashboardStats
          className="mb-8 grid gap-4 sm:grid-cols-3"
          items={[
            {
              label: "Employees",
              value: employees,
              icon: Users,
              accent: "info",
            },
            {
              label: "Managers",
              value: managers,
              icon: UserCog,
              accent: "default",
            },
            {
              label: "Pending approvals",
              value: pending,
              hint: "Org-wide submitted",
              icon: Clock,
              accent: pending > 0 ? "warning" : "success",
            },
          ]}
        />

        <FadeIn>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick access
          </h3>
          <StaggerGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <StaggerItem key={link.href}>
                  <Link href={link.href}>
                    <MotionCard className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 transition-transform group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{link.label}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{link.desc}</p>
                      </div>
                    </MotionCard>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        </FadeIn>
      </PageContainer>
    </>
  );
}
