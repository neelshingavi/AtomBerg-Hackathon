"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAchievementSheet } from "@/hooks/useAchievements";
import { useCheckinComments, useTeam } from "@/hooks/useCheckins";
import { CheckinCommentModal } from "@/components/checkins/CheckinCommentModal";
import { ProgressScore } from "@/components/checkins/ProgressScore";
import type { Quarter } from "@/lib/cycle";
import type { UoMType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export default function ManagerCheckinPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [commentOpen, setCommentOpen] = useState(false);

  const { data: teamData } = useTeam();
  const member = teamData?.team.find((t) => t.id === employeeId);
  const sheetId = member?.goalSheets?.[0]?.id;

  const { data, isLoading } = useAchievementSheet(sheetId, quarter);
  const { data: comments } = useCheckinComments(sheetId, quarter);

  const sheet = data?.goalSheet;

  if (isLoading) {
    return (
      <>
        <Topbar title="Team check-in" />
        <PageContainer>
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      </>
    );
  }

  if (!member || !sheet) {
    return (
      <>
        <Topbar title="Team check-in" />
        <PageContainer>
          <p className="text-muted-foreground">No approved goal sheet for this employee.</p>
          <ButtonLink className="mt-4" variant="outline" href="/manager/team">
            Back to team
          </ButtonLink>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Topbar title="Team check-in" />
      <PageContainer>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">{member.name}</p>
            <p className="text-sm text-muted-foreground">
              {member.employeeCode} · {sheet.cycle.name}
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink variant="outline" href="/manager/team">
              Back
            </ButtonLink>
            <Button onClick={() => setCommentOpen(true)}>Add check-in comment</Button>
          </div>
        </div>

        <Tabs value={quarter} onValueChange={(v) => setQuarter(v as Quarter)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {QUARTERS.map((q) => (
              <TabsTrigger key={q} value={q} disabled={!data?.quarterWindows?.[q]}>
                {q}
              </TabsTrigger>
            ))}
          </TabsList>

          {QUARTERS.map((q) => (
            <TabsContent key={q} value={q}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheet.goals.map((goal) => {
                    const ach = goal.achievements.find((a) => a.quarter === q);
                    return (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium max-w-xs">{goal.title}</TableCell>
                        <TableCell>
                          {goal.plannedTarget} {goal.unit}
                        </TableCell>
                        <TableCell>
                          {ach?.actualValue != null
                            ? `${ach.actualValue} ${goal.unit ?? ""}`
                            : ach?.completionDate
                              ? new Date(ach.completionDate).toLocaleDateString()
                              : "—"}
                        </TableCell>
                        <TableCell>{ach?.status ?? "NOT_STARTED"}</TableCell>
                        <TableCell>
                          <ProgressScore
                            input={{
                              uomType: goal.uomType as UoMType,
                              plannedTarget: goal.plannedTarget,
                              actualValue: ach?.actualValue,
                              targetDeadline: goal.targetDeadline
                                ? new Date(goal.targetDeadline)
                                : null,
                              completionDate: ach?.completionDate
                                ? new Date(ach.completionDate)
                                : null,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {comments && comments.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm font-medium">Your comments</p>
                    {comments.map((c) => (
                      <p key={c.id} className="text-sm text-muted-foreground">
                        {c.comment}
                        {c.rating != null && ` · Rating: ${c.rating}/5`}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <CheckinCommentModal
          open={commentOpen}
          onOpenChange={setCommentOpen}
          goalSheetId={sheetId!}
          quarter={quarter}
          employeeName={member.name}
        />
      </PageContainer>
    </>
  );
}
