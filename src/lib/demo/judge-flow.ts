/**
 * Judge-optimized presentation flow — increasing emotional intensity.
 * Maps to spotlight steps where applicable.
 */
import type { SpotlightId } from "./config";

export type JudgeFlowStep = {
  order: number;
  title: string;
  subtitle: string;
  route: string;
  wowMoment: string;
  spotlightId?: SpotlightId;
};

export const JUDGE_PRESENTATION_FLOW: JudgeFlowStep[] = [
  {
    order: 1,
    title: "Vision & Category",
    subtitle: "Landing — future of organizational intelligence",
    route: "/welcome",
    wowMoment: "Category differentiation + demo arc",
  },
  {
    order: 2,
    title: "Executive Briefing Center",
    subtitle: "Cinematic boardroom intelligence",
    route: "/admin/briefing",
    wowMoment: "AI narrative + war room mode",
    spotlightId: "executive-briefing",
  },
  {
    order: 3,
    title: "Organizational Pulse",
    subtitle: "Live executive health scoring",
    route: "/admin/executive#organization-pulse",
    wowMoment: "Pulse gauge + operational drama",
    spotlightId: "executive-dashboard",
  },
  {
    order: 4,
    title: "Strategic Alignment Network",
    subtitle: "Dependency graph + risk propagation",
    route: "/admin/alignment",
    wowMoment: "Graph activation + ripple effect",
    spotlightId: "alignment-graph",
  },
  {
    order: 5,
    title: "Execution Forecast Engine",
    subtitle: "Predictive scenarios + interventions",
    route: "/admin/forecast",
    wowMoment: "Risk radar + scenario simulation",
    spotlightId: "predictive-forecast",
  },
  {
    order: 6,
    title: "Incident Response",
    subtitle: "Escalation intelligence + leadership queue",
    route: "/admin/escalations",
    wowMoment: "Escalation propagation narrative",
    spotlightId: "escalations",
  },
  {
    order: 7,
    title: "Atom Strategic Advisor",
    subtitle: "AI chief-of-staff recommendations",
    route: "/admin/executive",
    wowMoment: "Structured strategic response",
    spotlightId: "ai-copilot",
  },
  {
    order: 8,
    title: "Workforce Coordination",
    subtitle: "Real-time collaboration + activity stream",
    route: "/admin/collaboration",
    wowMoment: "Live collaboration activity",
    spotlightId: "collaboration",
  },
  {
    order: 9,
    title: "Executive War Room",
    subtitle: "Demo finale — all systems active",
    route: "/admin/command-center",
    wowMoment: "Fullscreen war room + live pulse",
    spotlightId: "command-center",
  },
  {
    order: 10,
    title: "Boardroom Export",
    subtitle: "Presentation-ready intelligence artifact",
    route: "/admin/briefing",
    wowMoment: "PDF / export for leadership",
  },
];
