import { Topbar } from "@/components/layout/Topbar";
import { BoardroomBriefing } from "@/components/briefing/BoardroomBriefing";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ExecutiveBriefingPage() {
  return (
    <>
      <Topbar title="Executive Briefing Center" />
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 border-amber-500/30 bg-amber-500/10 text-amber-300">
              Primary demo experience
            </Badge>
            <p className="max-w-xl text-sm text-slate-500">
              Part 2 of the judge demo arc — cinematic executive narratives, war room mode, and
              boardroom-ready strategic storytelling. {`Helping organizations predict, align, and execute strategically.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/forecast" className="text-violet-400 hover:underline">
              Forecast →
            </Link>
            <Link href="/admin/alignment" className="text-brand-400 hover:underline">
              Alignment →
            </Link>
          </div>
        </div>
        <BoardroomBriefing />
      </div>
    </>
  );
}
