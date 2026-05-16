"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { format } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useGoalSheets } from "@/hooks/useGoals";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TableScroll } from "@/components/layout/TableScroll";
import { CheckSquare } from "lucide-react";

export default function ManagerApprovalsPage() {
  const { data, isLoading } = useGoalSheets({ status: "SUBMITTED" });

  return (
    <>
      <Topbar title="Approvals" />
      <PageContainer>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (data?.goalSheets.length ?? 0) === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No pending approvals"
            description="Submitted goal sheets from your team will appear here."
          />
        ) : (
          <TableScroll>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.goalSheets ?? []).map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sheet.employee.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {sheet.employee.employeeCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{sheet.employee.department.name}</TableCell>
                  <TableCell>{sheet.cycle.name}</TableCell>
                  <TableCell>{sheet.goalsCount}</TableCell>
                  <TableCell>
                    {sheet.submittedAt
                      ? format(new Date(sheet.submittedAt), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <GoalStatusBadge status={sheet.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ButtonLink size="sm" href={`/manager/approvals/${sheet.id}`}>
                      Review
                    </ButtonLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TableScroll>
        )}
      </PageContainer>
    </>
  );
}
