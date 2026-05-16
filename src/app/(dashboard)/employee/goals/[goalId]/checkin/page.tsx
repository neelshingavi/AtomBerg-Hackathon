"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { AchievementForm, type AchievementFormValue } from "@/components/checkins/AchievementForm";
import { useAchievementSheet, useSaveAchievements } from "@/hooks/useAchievements";
import { useCheckinComments } from "@/hooks/useCheckins";
import type { Quarter } from "@/lib/cycle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateSheetScore } from "@/lib/calculations/progress";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function EmployeeCheckinPage() {
  const params = useParams();
  const sheetId = params.goalId as string;
  const [quarter, setQuarter] = useState<Quarter>("Q1");

  const { data, isLoading } = useAchievementSheet(sheetId);
  const { data: comments } = useCheckinComments(sheetId, quarter);
  const save = useSaveAchievements();

  const [formState, setFormState] = useState<Record<string, AchievementFormValue>>({});

  const sheet = data?.goalSheet;
  const windows = data?.quarterWindows;

  const defaultQuarter = useMemo(() => {
    if (!windows) return "Q1" as Quarter;
    return QUARTERS.find((q) => windows[q]) ?? "Q1";
  }, [windows]);

  const activeQuarter = quarter || defaultQuarter;
  const quarterOpen = windows?.[activeQuarter] ?? false;

  const initForm = useCallback(
    (goalId: string, existing?: AchievementFormValue): AchievementFormValue => {
      return (
        formState[goalId] ??
        existing ?? {
          goalId,
          status: "NOT_STARTED",
          actualValue: null,
          completionDate: null,
          remark: null,
        }
      );
    },
    [formState]
  );

  async function handleSave() {
    if (!sheet || !quarterOpen) return;

    const achievements = sheet.goals.map((g) => {
      const v = formState[g.id] ?? initForm(g.id);
      return {
        goalId: g.id,
        actualValue: v.actualValue,
        completionDate: v.completionDate,
        status: v.status,
        remark: v.remark,
      };
    });

    try {
      await save.mutateAsync({
        goalSheetId: sheetId,
        quarter: activeQuarter,
        cycleId: sheet.cycleId,
        achievements,
      });
      toast.success(`${activeQuarter} achievements saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (isLoading) {
    return (
      <>
        <Topbar title="Quarterly check-in" />
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </>
    );
  }

  if (!sheet) {
    return (
      <>
        <Topbar title="Quarterly check-in" />
        <PageContainer>
          <p>Goal sheet not found.</p>
        </PageContainer>
      </>
    );
  }

  if (!sheet.isLocked || sheet.status !== "APPROVED") {
    return (
      <>
        <Topbar title="Quarterly check-in" />
        <PageContainer>
          <Alert variant="destructive">
            <AlertDescription>
              Check-ins are available only after your goals are approved and locked.
            </AlertDescription>
          </Alert>
          <ButtonLink className="mt-4" variant="outline" href={`/employee/goals/${sheetId}`}>
            Back to goal sheet
          </ButtonLink>
        </PageContainer>
      </>
    );
  }

  const sheetScore = calculateSheetScore(
    sheet.goals.map((g) => ({
      weightage: g.weightage,
      achievements: g.achievements.map((a) => ({
        quarter: a.quarter,
        progressScore: a.progressScore,
      })),
    })),
    activeQuarter
  );

  return (
    <>
      <Topbar title="Quarterly check-in" />
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{sheet.cycle.name}</p>
            <p className="text-lg font-semibold">Achievement check-in</p>
          </div>
          <ButtonLink variant="outline" href={`/employee/goals/${sheetId}`}>
            Back to goals
          </ButtonLink>
        </div>

        <Tabs
          value={activeQuarter}
          onValueChange={(v) => setQuarter(v as Quarter)}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            {QUARTERS.map((q) => (
              <TabsTrigger
                key={q}
                value={q}
                disabled={!windows?.[q]}
                className={!windows?.[q] ? "opacity-40" : ""}
              >
                {q}
                {!windows?.[q] && " 🔒"}
              </TabsTrigger>
            ))}
          </TabsList>

          {QUARTERS.map((q) => (
            <TabsContent key={q} value={q} className="space-y-4">
              {!windows?.[q] ? (
                <Alert>
                  <AlertDescription>
                    The {q} check-in window is not open yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Overall {q} weighted progress:{" "}
                    <span className="font-semibold text-foreground">
                      {Math.round(sheetScore * 100)}%
                    </span>
                  </p>

                  {sheet.goals.map((goal) => {
                    const existing = goal.achievements.find((a) => a.quarter === q);
                    const value = initForm(goal.id, {
                      goalId: goal.id,
                      actualValue: existing?.actualValue ?? null,
                      completionDate: existing?.completionDate ?? null,
                      status:
                        (existing?.status as AchievementFormValue["status"]) ?? "NOT_STARTED",
                      remark: existing?.remark ?? null,
                    });

                    return (
                      <AchievementForm
                        key={goal.id}
                        goal={goal}
                        quarter={q}
                        disabled={!quarterOpen || q !== activeQuarter}
                        value={value}
                        onChange={(v) =>
                          setFormState((prev) => ({ ...prev, [goal.id]: v }))
                        }
                      />
                    );
                  })}

                  {comments && comments.length > 0 && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription>
                        <p className="font-medium text-blue-900 mb-1">Manager feedback</p>
                        {comments.map((c) => (
                          <p key={c.id} className="text-sm text-blue-800">
                            {c.manager.name}: {c.comment}
                          </p>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={save.isPending || q !== activeQuarter}>
                      {save.isPending ? "Saving…" : `Save ${q} achievements`}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </PageContainer>
    </>
  );
}
