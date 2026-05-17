import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { PredictiveDashboard } from "@/components/forecasting/PredictiveDashboard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ForecastPage() {
  return (
    <>
      <Topbar title="Execution Forecast Engine" />
      <PageContainer>
        <PageHeader
          title="Predictive Execution Intelligence"
          description="Proactive workforce execution intelligence — forecast risks, simulate scenarios, and intervene before failures occur."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
              >
                Forward-looking
              </Badge>
              <Link
                href="/admin/briefing"
                className="text-sm font-semibold text-amber-600 hover:underline"
              >
                Executive briefing →
              </Link>
              <Link
                href="/admin/executive"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Executive dashboard →
              </Link>
              <Link
                href="/admin/alignment"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                Alignment graph →
              </Link>
            </div>
          }
        />
        <PredictiveDashboard />
      </PageContainer>
    </>
  );
}
