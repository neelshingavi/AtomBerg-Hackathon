"use client";

import Link from "next/link";
import {
  Target,
  Clock,
  TrendingUp,
  CalendarClock,
  Share2,
  Award,
  AlertTriangle,
  PenLine,
  ClipboardCheck,
} from "lucide-react";
import { DashboardHero } from "@/components/dashboard/shared/DashboardHero";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CycleStatusBanner } from "@/components/dashboard/CycleStatusBanner";
import { QuarterlyProgressCard } from "@/components/dashboard/QuarterlyProgressCard";
import { ActionCard } from "@/components/ui/action-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ButtonLink } from "@/components/ui/button-link";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/motion";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import type { GoalStatus } from "@prisma/client";

type GoalProgress = {
  id: string;
  title: string;
  weightage: number;
  progressPct: number;
};

type UpcomingAction = {
  id: string;
  type: "checkin" | "deadline" | "rejected" | "escalation";
  title: string;
  description: string;
  href: string;
  severity?: "low" | "medium" | "critical";
};

export function EmployeeDashboardView({
  firstName,
  cycleName,
  fiscalYear,
  sheetStatus,
  completionPct,
  quarterlyPct,
  quarterlyLabel,
  goalSheetId,
  goalsCount,
  achievementsByQuarter,
  goals,
  openQuarter,
  kpis,
  goalProgress,
  upcomingActions,
}: {
  firstName: string;
  cycleName?: string;
  fiscalYear?: string;
  sheetStatus?: GoalStatus | null;
  completionPct: number;
  quarterlyPct: number;
  quarterlyLabel: string;
  goalSheetId?: string;
  goalsCount?: number;
  achievementsByQuarter?: Record<string, number>;
  goals: Array<{
    weightage: number;
    achievements: Array<{ quarter: string; progressScore: number | null }>;
  }>;
  openQuarter?: string | null;
  kpis: {
    goalsSubmitted: number;
    pendingReviews: number;
    sharedGoals: number;
    upcomingDeadlines: number;
  };
  goalProgress: GoalProgress[];
  upcomingActions: UpcomingAction[];
}) {
  const actionIcons = {
    checkin: ClipboardCheck,
    deadline: CalendarClock,
    rejected: AlertTriangle,
    escalation: AlertTriangle,
  };

  const severityClass = {
    low: "border-emerald-200 bg-emerald-50/50",
    medium: "border-amber-200 bg-amber-50/50",
    critical: "border-red-200 bg-red-50/50",
  };

  return (
    <div className="space-y-8">
      <DashboardHero
        greeting={`Good day, ${firstName}`}
        subtitle="Track goals, complete check-ins, and stay on pace for the cycle."
        cycleName={cycleName ? `${cycleName}${fiscalYear ? ` · ${fiscalYear}` : ""}` : undefined}
        completionPct={completionPct}
        quarterlyLabel={quarterlyLabel}
        quarterlyPct={quarterlyPct}
        variant="employee"
      />

      <CycleStatusBanner
        goalSheetId={goalSheetId}
        goalsCount={goalsCount}
        achievementsByQuarter={achievementsByQuarter}
      />

      <DashboardStats
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        items={[
          {
            label: "Goals submitted",
            value: kpis.goalsSubmitted,
            hint: "Active on your sheet",
            icon: Target,
            accent: "info",
            trend: kpis.goalsSubmitted > 0 ? "up" : "neutral",
            trendLabel: kpis.goalsSubmitted > 0 ? "On track" : "Add goals",
          },
          {
            label: "Pending reviews",
            value: kpis.pendingReviews,
            hint: "Awaiting manager",
            icon: Clock,
            accent: kpis.pendingReviews > 0 ? "warning" : "success",
            trend: kpis.pendingReviews > 0 ? "neutral" : "up",
          },
          {
            label: "Completion",
            value: `${completionPct}%`,
            hint: "Weighted progress",
            icon: TrendingUp,
            accent: completionPct >= 70 ? "success" : "warning",
            trend: completionPct >= 50 ? "up" : "down",
            trendLabel: `${completionPct}%`,
          },
          {
            label: "Upcoming deadlines",
            value: kpis.upcomingDeadlines,
            hint: "Next 30 days",
            icon: CalendarClock,
            accent: kpis.upcomingDeadlines > 0 ? "warning" : "neutral",
          },
          {
            label: "Shared goals",
            value: kpis.sharedGoals,
            hint: "Org-assigned",
            icon: Share2,
            accent: "info",
          },
          {
            label: "Achievement progress",
            value: `${quarterlyPct}%`,
            hint: quarterlyLabel,
            icon: Award,
            accent: "success",
            trend: quarterlyPct >= 50 ? "up" : "neutral",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card className="enterprise-card">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-600" />
                Goal progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {goalProgress.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No goals yet. Create your sheet to start tracking progress.
                </p>
              ) : (
                goalProgress.map((g) => (
                  <div key={g.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{g.title}</p>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {g.weightage}% · {g.progressPct}%
                      </span>
                    </div>
                    <Progress value={g.progressPct} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {goals.length > 0 && (
          <FadeIn>
            <QuarterlyProgressCard goals={goals} openQuarter={openQuarter} />
          </FadeIn>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card className="enterprise-card h-full">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="type-card">Upcoming actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingActions.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  You&apos;re all caught up — no pending actions.
                </p>
              ) : (
                <ul className="divide-y">
                  {upcomingActions.map((a) => {
                    const Icon = actionIcons[a.type];
                    return (
                      <li key={a.id}>
                        <Link
                          href={a.href}
                          className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${
                            a.severity ? severityClass[a.severity] : ""
                          }`}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          </div>
                          {a.severity && (
                            <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
                              {a.severity}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <ActivityFeed limit={8} enhanced />
      </div>

      {!goalSheetId && cycleName && (
        <FadeIn>
          <ActionCard
            href="/employee/goals/new"
            title="Create your goal sheet"
            description={`Start building goals for ${cycleName} before the window closes.`}
            icon={PenLine}
            variant="primary"
          />
        </FadeIn>
      )}

      {sheetStatus && ["DRAFT", "REWORK"].includes(sheetStatus) && goalSheetId && (
        <FadeIn>
          <ActionCard
            href={`/employee/goals/${goalSheetId}`}
            title="Continue editing"
            description="Complete your draft and submit for manager approval."
            icon={PenLine}
            variant="warning"
          />
        </FadeIn>
      )}

      {sheetStatus === "APPROVED" && goalSheetId && (
        <StaggerGrid className="grid gap-4 sm:grid-cols-2">
          <StaggerItem>
            <ActionCard
              href="/employee/checkins"
              title="Quarterly check-in"
              description="Log achievements and progress for approved goals."
              icon={ClipboardCheck}
              variant="success"
            />
          </StaggerItem>
          <StaggerItem>
            <Card className="flex items-center justify-between p-5 enterprise-card">
              <div>
                <p className="type-label">Sheet status</p>
                <GoalStatusBadge status={sheetStatus} />
              </div>
              <ButtonLink href={`/employee/goals/${goalSheetId}`} size="sm" variant="outline">
                View sheet
              </ButtonLink>
            </Card>
          </StaggerItem>
        </StaggerGrid>
      )}
    </div>
  );
}
