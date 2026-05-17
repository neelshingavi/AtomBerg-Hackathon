import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { CollaborationSpaces } from "@/components/collaboration/CollaborationSpaces";

export default function CollaborationPage() {
  return (
    <>
      <Topbar title="Collaboration spaces" />
      <PageContainer>
        <CollaborationSpaces />
      </PageContainer>
    </>
  );
}
