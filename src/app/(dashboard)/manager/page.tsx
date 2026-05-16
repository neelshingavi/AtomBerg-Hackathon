import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { prisma } from "@/lib/prisma";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PageHeader } from "@/components/ui/page-header";
import { ActionCard } from "@/components/ui/action-card";
import { Users, Clock, CheckSquare, TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/motion";

export default async function ManagerDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pending = await prisma.goalSheet.count({
    where: { managerId: session.user.id, status: "SUBMITTED" },
  });

  const teamSize = await prisma.user.count({
    where: { managerId: session.user.id, isActive: true, role: "EMPLOYEE" },
  });

  return (
    <>
      <Topbar title="Manager dashboard" />
      <PageContainer>
        <PageHeader
          title="Team overview"
          description="Review submissions, track check-ins, and push shared organizational goals."
        />

        <DashboardStats
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          items={[
            {
              label: "Team size",
              value: teamSize,
              hint: "Direct reports",
              icon: Users,
              accent: "info",
            },
            {
              label: "Pending approvals",
              value: pending,
              hint: pending > 0 ? "Needs your review" : "All caught up",
              icon: Clock,
              accent: pending > 0 ? "warning" : "success",
            },
            {
              label: "Quick action",
              value: "Review",
              hint: "Approval queue",
              icon: CheckSquare,
              accent: "default",
            },
            {
              label: "Insights",
              value: "Analytics",
              hint: "Team performance",
              icon: TrendingUp,
              accent: "neutral",
            },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FadeIn>
            <ActionCard
              href="/manager/approvals"
              title="Approval queue"
              description={
                pending > 0
                  ? `${pending} goal sheet${pending === 1 ? "" : "s"} awaiting your decision.`
                  : "No pending submissions right now."
              }
              icon={CheckSquare}
              variant={pending > 0 ? "primary" : "default"}
            />
          </FadeIn>
          <FadeIn>
            <ActionCard
              href="/manager/team"
              title="Team check-ins"
              description="View direct reports and their quarterly achievement status."
              icon={Users}
            />
          </FadeIn>
        </div>
      </PageContainer>
    </>
  );
}
