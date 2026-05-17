import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { ExecutiveDashboard } from "@/components/analytics/ExecutiveDashboard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExecutivePdfExport } from "./ExecutivePdfExport";
import { PRODUCT } from "@/lib/brand";

export default function ExecutivePage() {
  return (
    <>
      <Topbar title="Executive Intelligence Center" />
      <PageContainer>
        <PageHeader
          title="Organizational Pulse & Strategic Execution"
          description="Operational intelligence for leadership — alignment health, workforce risk, execution bottlenecks, and AI-recommended interventions across the enterprise."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ExecutivePdfExport />
              <Badge
                variant="secondary"
                className="animate-pulse border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Live intelligence
              </Badge>
              <Link
                href="/admin/briefing"
                className="text-sm font-semibold text-amber-600 hover:underline"
              >
                Executive Briefing Center →
              </Link>
              <Link
                href="/admin/forecast"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Execution Forecast Engine →
              </Link>
              <Link
                href="/admin/alignment"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                Strategic Alignment Network →
              </Link>
              <Link
                href="/admin/command-center"
                className="text-sm font-medium text-cyan-600 hover:underline"
              >
                Leadership Response Center →
              </Link>
            </div>
          }
        />

        <nav
          className="mb-6 flex gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin"
          aria-label="Executive intelligence sections"
        >
          {[
            ["#organization-pulse", "Organizational Pulse"],
            ["#overview", "Execution Overview"],
            ["#insights", "AI Strategic Insights"],
            ["#department-health", "Unit Health"],
            ["#operations", "Operational Intelligence"],
            ["#alignment", "Alignment Network"],
            ["/admin/alignment", "Full alignment graph →"],
            ["#escalations", "Risk Command"],
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

        <p className="mb-6 text-xs text-muted-foreground">
          {PRODUCT.mission} · {PRODUCT.category}
        </p>

        <ExecutiveDashboard />
      </PageContainer>
    </>
  );
}
