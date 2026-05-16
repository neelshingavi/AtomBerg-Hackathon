"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useTeam } from "@/hooks/useCheckins";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ManagerTeamPage() {
  const { data, isLoading } = useTeam();

  return (
    <>
      <Topbar title="My team" />
      <PageContainer>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Goal status</TableHead>
                <TableHead className="text-right">Check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.team ?? []).map((member) => {
                const sheet = member.goalSheets?.[0];
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {member.employeeCode}
                      </p>
                    </TableCell>
                    <TableCell>{member.department.name}</TableCell>
                    <TableCell>
                      {sheet ? (
                        <Badge variant="outline">{sheet.status}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No sheet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {sheet?.status === "APPROVED" ? (
                        <ButtonLink
                          size="sm"
                          href={`/manager/team/${member.id}/checkin`}
                        >
                          Review check-in
                        </ButtonLink>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!isLoading && (data?.team.length ?? 0) === 0 && (
          <p className="text-center text-muted-foreground py-12">No direct reports.</p>
        )}
      </PageContainer>
    </>
  );
}
