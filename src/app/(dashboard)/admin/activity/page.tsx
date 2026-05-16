"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { OperationalActivityCenter } from "@/components/operations/operational-activity-center";

export default function AdminActivityPage() {
  return (
    <>
      <Topbar title="Activity center" />
      <PageContainer>
        <PageHeader
          title="Organization activity"
          description="Real-time stream of approvals, submissions, escalations, and audit events."
        />
        <OperationalActivityCenter limit={40} />
      </PageContainer>
    </>
  );
}
