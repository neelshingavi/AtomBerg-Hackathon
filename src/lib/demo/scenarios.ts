/**
 * Scripted demo scenarios — consistent wow moments for judge presentations.
 */
export type DemoScenarioId =
  | "approval-bottleneck"
  | "risk-spike"
  | "dependency-propagation"
  | "executive-intervention"
  | "ai-mitigation";

export type DemoScenario = {
  id: DemoScenarioId;
  title: string;
  headline: string;
  narrative: string;
  impact: string;
  leadershipAction: string;
  /** Primary route to demonstrate this scenario */
  route: string;
  /** Suggested copilot prompt */
  copilotPrompt?: string;
  wowMoment: string;
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "approval-bottleneck",
    title: "Approval Bottleneck",
    headline: "Operations approval queue blocking strategic execution",
    narrative:
      "12 initiatives await manager sign-off. Average latency increased 34% — a classic execution fracture point.",
    impact: "Q3 revenue targets exposed if clearance delayed beyond 48 hours.",
    leadershipAction: "Open Leadership Response Center → expedite approval queue",
    route: "/admin/command-center",
    copilotPrompt: "Explain approval latency impact on quarterly execution targets",
    wowMoment: "Live approval queue + operational pulse shift",
  },
  {
    id: "risk-spike",
    title: "Organizational Risk Spike",
    headline: "Organizational pulse entered watchlist territory",
    narrative:
      "Pulse score declined 3 points. Escalation volume in Operations correlates with approval delays.",
    impact: "Executive visibility required before risk propagates to dependent units.",
    leadershipAction: "Executive Intelligence Center → review pulse + AI insights",
    route: "/admin/executive",
    copilotPrompt: "What requires leadership attention right now?",
    wowMoment: "Operational drama banner + pulse transition",
  },
  {
    id: "dependency-propagation",
    title: "Initiative Delay Propagation",
    headline: "Dependency risk spreading across Revenue Growth chain",
    narrative:
      "Engineering deliverable delay threatens downstream Customer Success goals — alignment graph shows propagation.",
    impact: "Cross-functional initiative at risk without executive prioritization.",
    leadershipAction: "Strategic Alignment Network → trace dependency chain",
    route: "/admin/alignment",
    copilotPrompt: "Show dependency bottlenecks across strategic initiatives",
    wowMoment: "Alignment graph activation + risk propagation animation",
  },
  {
    id: "executive-intervention",
    title: "Executive Intervention",
    headline: "Leadership Response Center — incident coordination",
    narrative:
      "Real-time presence, executive alerts, and incident mode demonstrate operational command capability.",
    impact: "Demonstrates Fortune 500-grade operational response, not task tracking.",
    leadershipAction: "Enter War Room fullscreen mode",
    route: "/admin/command-center",
    wowMoment: "War room transition with live pulse + alerts",
  },
  {
    id: "ai-mitigation",
    title: "AI-Recommended Mitigation",
    headline: "Atom Strategic Advisor recommends intervention playbook",
    narrative:
      "AI synthesizes operational context, explains business impact, and prioritizes leadership actions.",
    impact: "Judges see AI as chief-of-staff, not a chatbot.",
    leadershipAction: "Open Strategic Advisor → ask for executive briefing",
    route: "/admin/executive",
    copilotPrompt: "Generate an executive briefing for leadership review",
    wowMoment: "Structured AI response with confidence + leadership action",
  },
];

export function getScenario(id: DemoScenarioId): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}
