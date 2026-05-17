"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { OperationalActivityCenter } from "@/components/operations/operational-activity-center";
import { LiveActivityStream } from "@/components/realtime/LiveActivityStream";
import { PresenceAvatars } from "@/components/realtime/PresenceAvatars";
import { ExecutiveAlertCenter } from "@/components/realtime/ExecutiveAlertCenter";

export default function AdminActivityPage() {
  return (
    <>
      <Topbar title="Activity center" />
      <PageContainer>
        <PageHeader
          title="Organization activity"
          description="Real-time stream of approvals, submissions, escalations, and audit events."
          actions={<PresenceAvatars max={6} />}
        />
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <LiveActivityStream limit={30} />
          <ExecutiveAlertCenter />
        </div>
        <OperationalActivityCenter limit={40} />
      </PageContainer>
    </>
  );
}
