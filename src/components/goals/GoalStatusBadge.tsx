import { Badge } from "@/components/ui/badge";
import type { GoalStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const styles: Record<GoalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-800 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
  REWORK: "bg-orange-50 text-orange-800 border-orange-200",
};

const labels: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REWORK: "Rework",
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return (
    <Badge
      variant="outline"
      data-testid="status-badge"
      className={cn("font-medium", styles[status])}
    >
      {labels[status]}
    </Badge>
  );
}
