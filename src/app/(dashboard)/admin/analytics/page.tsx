import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <>
      <Topbar title="Operational Intelligence" />
      <PageContainer>
        <AnalyticsDashboard scope="admin" />
      </PageContainer>
    </>
  );
}
