import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { AlignmentIntelligence } from "@/components/alignment/AlignmentIntelligence";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AlignmentPage() {
  return (
    <>
      <Topbar title="Strategic alignment intelligence" />
      <PageContainer>
        <PageHeader
          title="Organizational Alignment Graph"
          description="Interactive execution intelligence — strategic objectives, workforce relationships, dependencies, risk propagation, and cross-functional collaboration."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="animate-pulse border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
              >
                Live graph
              </Badge>
              <Link
                href="/admin/executive"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Executive dashboard →
              </Link>
            </div>
          }
        />

        <AlignmentIntelligence />
      </PageContainer>
    </>
  );
}
