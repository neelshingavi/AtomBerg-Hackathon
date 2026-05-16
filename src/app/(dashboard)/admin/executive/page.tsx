import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { ExecutiveDashboard } from "@/components/analytics/ExecutiveDashboard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ExecutivePage() {
  return (
    <>
      <Topbar title="Executive intelligence" />
      <PageContainer>
        <PageHeader
          title="Organizational intelligence"
          description="Real-time executive view of goal performance, department health, risks, and escalations across Atomberg."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="animate-pulse border-emerald-200 bg-emerald-50 text-emerald-700">
                Live
              </Badge>
              <Link
                href="/admin/analytics"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Detailed analytics →
              </Link>
            </div>
          }
        />

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
          {[
            ["#overview", "Overview"],
            ["#insights", "AI insights"],
            ["#department-health", "Departments"],
            ["#operations", "Operations"],
            ["#alignment", "Alignment"],
            ["#escalations", "Escalations"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full border bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:border-brand-300 hover:text-brand-600"
            >
              {label}
            </a>
          ))}
        </nav>

        <ExecutiveDashboard />
      </PageContainer>
    </>
  );
}
