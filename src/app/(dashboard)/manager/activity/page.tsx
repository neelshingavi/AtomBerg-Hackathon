"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { OperationalActivityCenter } from "@/components/operations/operational-activity-center";

export default function ManagerActivityPage() {
  return (
    <>
      <Topbar title="Activity center" />
      <PageContainer>
        <PageHeader
          title="Team activity"
          description="Approvals, submissions, and events across your direct reports."
        />
        <OperationalActivityCenter limit={30} />
      </PageContainer>
    </>
  );
}
