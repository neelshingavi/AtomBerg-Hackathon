"use client";

import { ButtonLink } from "@/components/ui/button-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableScroll } from "@/components/layout/TableScroll";
import type { GoalSheetSummary } from "@/hooks/useGoals";
import { format } from "date-fns";
import { Target } from "lucide-react";

export function GoalTable({ sheets }: { sheets: GoalSheetSummary[] }) {
  if (sheets.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goal sheets yet"
        description="Create your first goal sheet for the active cycle to get started."
        action={
          <ButtonLink href="/employee/goals/new">Create goal sheet</ButtonLink>
        }
      />
    );
  }

  return (
    <TableScroll>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cycle</TableHead>
          <TableHead>Goals</TableHead>
          <TableHead>Weightage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sheets.map((sheet) => (
          <TableRow key={sheet.id}>
            <TableCell className="font-medium">{sheet.cycle.name}</TableCell>
            <TableCell>{sheet.goalsCount}</TableCell>
            <TableCell>{sheet.totalWeightage}%</TableCell>
            <TableCell>
              <GoalStatusBadge status={sheet.status} />
            </TableCell>
            <TableCell>
              {sheet.submittedAt
                ? format(new Date(sheet.submittedAt), "MMM d, yyyy")
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <ButtonLink variant="outline" size="sm" href={`/employee/goals/${sheet.id}`}>
                View
              </ButtonLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableScroll>
  );
}
