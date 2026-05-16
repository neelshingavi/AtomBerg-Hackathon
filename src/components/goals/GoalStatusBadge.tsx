import { Badge } from "@/components/ui/badge";
import type { GoalStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const styles: Record<GoalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200/80 shadow-sm",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200/80 shadow-sm",
  UNDER_REVIEW: "bg-blue-50 text-blue-800 border-blue-200/80 shadow-sm",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-sm",
  REJECTED: "bg-red-50 text-red-800 border-red-200/80 shadow-sm",
  REWORK: "bg-orange-50 text-orange-800 border-orange-200/80 shadow-sm",
};

const labels: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REWORK: "Rework",
};

const dots: Record<GoalStatus, string> = {
  DRAFT: "bg-slate-400",
  SUBMITTED: "bg-amber-500",
  UNDER_REVIEW: "bg-blue-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  REWORK: "bg-orange-500",
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return (
    <Badge
      variant="outline"
      data-testid="status-badge"
      className={cn("gap-1.5 font-medium", styles[status])}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </Badge>
  );
}
