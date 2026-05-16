import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function ManagerAnalyticsPage() {
  return (
    <>
      <Topbar title="Team analytics" />
      <PageContainer>
        <AnalyticsDashboard scope="manager" />
      </PageContainer>
    </>
  );
}
