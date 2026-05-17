import type { BriefingFlowStep } from "./types";
import type { BoardroomSnapshot } from "./types";

export function buildBriefingFlow(snapshot: BoardroomSnapshot): BriefingFlowStep[] {
  const weekly = snapshot.narratives.find((n) => n.period === "weekly");

  return [
    {
      id: "pulse",
      title: "Organization Pulse",
      subtitle: "Live workforce health",
      narrative: snapshot.pulse.narrative,
      anchor: "#briefing-pulse",
    },
    {
      id: "alignment",
      title: "Strategic Alignment",
      subtitle: `${snapshot.alignmentScore}% alignment density`,
      narrative:
        weekly?.paragraphs.find((p) => p.includes("alignment")) ??
        "Strategic linkage across departments and shared initiatives.",
      anchor: "#briefing-alignment",
    },
    {
      id: "risks",
      title: "Operational Risks",
      subtitle: `${snapshot.pulse.stateLabel} risk posture`,
      narrative:
        snapshot.whyItMatters[0]?.businessImpact ??
        "Current operational risks and escalation patterns.",
      anchor: "#briefing-risks",
    },
    {
      id: "predictive",
      title: "Predictive Threats",
      subtitle: snapshot.predictive?.overallRiskOutlook ?? "Forecast loading",
      narrative:
        snapshot.predictive?.executiveNarrative ??
        "Forward-looking execution and risk forecasts.",
      anchor: "#briefing-predictive",
    },
    {
      id: "managers",
      title: "Manager Effectiveness",
      subtitle: "Leadership execution intelligence",
      narrative:
        snapshot.managers[0]?.narrative ??
        "Manager responsiveness and team execution patterns.",
      anchor: "#briefing-managers",
    },
    {
      id: "priorities",
      title: "Leadership Priorities",
      subtitle: "Ranked interventions",
      narrative:
        snapshot.priorities[0]?.description ??
        "Top actions for executive leadership this period.",
      anchor: "#briefing-priorities",
    },
    {
      id: "initiatives",
      title: "Strategic Initiatives",
      subtitle: `${snapshot.initiatives.length} tracked initiatives`,
      narrative: "Initiative health, momentum, and forecast success probability.",
      anchor: "#briefing-initiatives",
    },
  ];
}
