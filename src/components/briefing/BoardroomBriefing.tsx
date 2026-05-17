"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Presentation, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardroomSnapshot } from "@/hooks/useBoardroom";
import { OrganizationPulse } from "@/components/intelligence/OrganizationPulse";
import { RiskRadarChart } from "@/components/forecasting/RiskRadarChart";
import { LeadershipRecommendations } from "@/components/intelligence/LeadershipRecommendations";
import { ExecutiveTickerRibbon } from "./ExecutiveTickerRibbon";
import { BriefingInsightCarousel } from "./BriefingInsightCarousel";
import { BriefingFlowNav } from "./BriefingFlowNav";
import { WhyItMattersLayer } from "./WhyItMattersLayer";
import { LeadershipPrioritiesPanel } from "./LeadershipPrioritiesPanel";
import { DepartmentStoryboardsGrid } from "./DepartmentStoryboardsGrid";
import { ManagerEffectivenessBriefing } from "./ManagerEffectivenessBriefing";
import { InitiativeTrackingCenter } from "./InitiativeTrackingCenter";
import { ExecutiveHeatmapBriefing } from "./ExecutiveHeatmapBriefing";
import { TimelineReplayNarration } from "./TimelineReplayNarration";
import { BriefingExportBar } from "./BriefingExportBar";
import { DepartmentRankingsBriefing } from "./DepartmentRankingsBriefing";
import { cn } from "@/lib/utils";

export function BoardroomBriefing() {
  const { data, isLoading, refetch } = useBoardroomSnapshot();
  const [warRoom, setWarRoom] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [activeStep, setActiveStep] = useState("pulse");
  const [narrativeIndex, setNarrativeIndex] = useState(1);

  const exitModes = useCallback(() => {
    setWarRoom(false);
    setPresentation(false);
    document.documentElement.classList.remove("overflow-hidden");
  }, []);

  const enterWarRoom = () => {
    setWarRoom(true);
    setPresentation(false);
    document.documentElement.classList.add("overflow-hidden");
  };

  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => void refetch(), 90_000);
    return () => clearInterval(id);
  }, [data, refetch]);

  if (isLoading || !data) {
    return <Skeleton className="h-[90vh] w-full rounded-xl bg-slate-900" />;
  }

  const weeklyNarrative = data.narratives.find((n) => n.period === "weekly");

  const content = (
    <motion.div
      className={cn(
        "briefing-canvas relative space-y-8",
        (warRoom || presentation) && "min-h-screen p-6 md:p-10"
      )}
      data-briefing-mode
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/20 via-slate-950 to-slate-950"
        aria-hidden
      />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <motion.div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-400">
              Executive Briefing Mode
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Organizational Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {data.cycleName} · AI-generated leadership intelligence ·{" "}
              {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => void refetch()}
            >
              Refresh intelligence
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-white/20 text-white",
                presentation && "bg-violet-600/30"
              )}
              onClick={() => {
                setPresentation((p) => !p);
                setWarRoom(false);
              }}
            >
              <Presentation className="mr-1.5 h-4 w-4" />
              Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("border-red-500/40 text-red-300", warRoom && "bg-red-500/20")}
              onClick={() => (warRoom ? exitModes() : enterWarRoom())}
            >
              {warRoom ? (
                <Minimize2 className="mr-1.5 h-4 w-4" />
              ) : (
                <Maximize2 className="mr-1.5 h-4 w-4" />
              )}
              War Room
            </Button>
            <BriefingExportBar cycleId={data.cycleId} />
          </div>
        </motion.div>

        <ExecutiveTickerRibbon metrics={data.ticker} />
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-brand-950/30 p-6 md:p-8"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {data.narratives.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNarrativeIndex(i)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                narrativeIndex === i
                  ? "bg-brand-600 text-white"
                  : "bg-white/10 text-slate-400 hover:text-white"
              )}
            >
              {n.period}
            </button>
          ))}
        </div>
        <h2 className="text-xl font-semibold text-white md:text-2xl">
          {data.narratives[narrativeIndex]?.headline}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          {data.narratives[narrativeIndex]?.summary}
        </p>
        <ul className="mt-4 space-y-2">
          {data.narratives[narrativeIndex]?.paragraphs.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-400">
              <span className="text-brand-400">▸</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-white/10 pt-4 text-sm font-medium text-amber-200/90">
          {data.narratives[narrativeIndex]?.whyItMatters}
        </p>
      </motion.section>

      <BriefingFlowNav
        steps={data.flowSteps}
        activeStep={activeStep}
        onStep={setActiveStep}
      />

      <motion.div
        id="briefing-pulse"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
      >
        <OrganizationPulse />
      </motion.div>

      <BriefingInsightCarousel insights={data.insights} />

      <div className="grid gap-6 lg:grid-cols-2">
        {data.predictive && (
          <section id="briefing-predictive">
            <RiskRadarChart items={data.predictive.riskRadar} />
          </section>
        )}
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
          <h3 className="mb-2 text-sm font-medium text-white">Executive briefing summary</h3>
          <p className="text-sm text-slate-300">{data.briefing.summary}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-500">
            {data.briefing.nextActions.map((a, i) => (
              <li key={i}>→ {a}</li>
            ))}
          </ul>
        </div>
      </div>

      <WhyItMattersLayer items={data.whyItMatters} />

      <DepartmentRankingsBriefing rows={data.departmentHealth} />

      <DepartmentStoryboardsGrid storyboards={data.departmentStoryboards} />

      <ManagerEffectivenessBriefing managers={data.managers} />

      <LeadershipPrioritiesPanel priorities={data.priorities} />

      <InitiativeTrackingCenter initiatives={data.initiatives} />

      <ExecutiveHeatmapBriefing predictive={data.predictive} />

      <TimelineReplayNarration
        timeline={data.timelineReplay}
        narrative={weeklyNarrative?.summary}
      />

      <LeadershipRecommendations />

      <footer className="flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm text-slate-500">
        <Link href="/admin/alignment" className="hover:text-brand-400">
          Alignment graph →
        </Link>
        <Link href="/admin/forecast" className="hover:text-violet-400">
          Predictive forecast →
        </Link>
        <Link href="/admin/executive" className="hover:text-slate-300">
          Executive dashboard →
        </Link>
      </footer>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {warRoom && (
          <motion.div
            key="war-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950"
          >
            <div className="sticky top-0 z-50 flex items-center justify-between border-b border-red-500/30 bg-slate-950/95 px-6 py-3 backdrop-blur-md">
              <motion.div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-widest text-red-400">
                  War Room — Live Operations
                </span>
              </motion.div>
              <Button variant="ghost" size="icon" onClick={exitModes} className="text-slate-400">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {content}
          </motion.div>
        )}
      </AnimatePresence>

      {!warRoom && (
        <div
          className={cn(
            presentation && "fixed inset-0 z-40 overflow-y-auto bg-slate-950"
          )}
        >
          {presentation && (
            <div className="sticky top-0 z-50 flex items-center justify-between border-b border-violet-500/30 bg-slate-950/95 px-6 py-3">
              <span className="text-sm font-medium text-violet-300">Presentation mode</span>
              <Button variant="ghost" size="sm" onClick={exitModes}>
                Exit presentation
              </Button>
            </div>
          )}
          <div className={cn(presentation && "mx-auto max-w-5xl px-6 py-8")}>{content}</div>
        </div>
      )}
    </>
  );
}
