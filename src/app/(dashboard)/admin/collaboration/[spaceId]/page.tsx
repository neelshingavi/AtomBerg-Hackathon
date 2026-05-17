import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { CollaborationRoom } from "@/components/collaboration/CollaborationRoom";
import Link from "next/link";

export default function CollaborationRoomPage({
  params,
}: {
  params: { spaceId: string };
}) {
  return (
    <>
      <Topbar title="Collaboration room" />
      <PageContainer>
        <Link href="/admin/collaboration" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
          ← All spaces
        </Link>
        <CollaborationRoom spaceId={params.spaceId} />
      </PageContainer>
    </>
  );
}
