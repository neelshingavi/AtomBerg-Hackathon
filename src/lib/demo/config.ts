export type DemoRole = "EMPLOYEE" | "MANAGER" | "ADMIN" | "EXECUTIVE";

export const DEMO_PASSWORD = "password123";

export const DEMO_ACCOUNTS: Record<
  DemoRole,
  { email: string; label: string; description: string; landingPath: string }
> = {
  EMPLOYEE: {
    email: "employee@demo.com",
    label: "Workforce",
    description: "Strategic goals, progress signals, and cross-team initiatives",
    landingPath: "/employee",
  },
  MANAGER: {
    email: "manager@demo.com",
    label: "Leadership",
    description: "Approval queue, team intelligence, and execution coordination",
    landingPath: "/manager",
  },
  ADMIN: {
    email: "admin@demo.com",
    label: "Platform Admin",
    description: "Organizational configuration, governance, and intelligence layers",
    landingPath: "/admin",
  },
  EXECUTIVE: {
    email: "admin@demo.com",
    label: "Executive",
    description:
      "Organizational pulse, strategic alignment, predictive execution intelligence",
    landingPath: "/admin/executive",
  },
};

export type SpotlightId =
  | "executive-briefing"
  | "alignment-graph"
  | "predictive-forecast"
  | "command-center"
  | "ai-copilot"
  | "live-activity"
  | "collaboration"
  | "executive-dashboard"
  | "escalations"
  | "audit-replay"
  | "automation-builder";

/** Cinematic judge presentation flow — problem → platform → live intelligence → decisions → future */
export const JUDGE_DEMO_FLOW = [
  "executive-briefing",
  "alignment-graph",
  "predictive-forecast",
  "command-center",
  "ai-copilot",
  "live-activity",
  "collaboration",
  "executive-dashboard",
] as const;

export type SpotlightStep = {
  id: SpotlightId;
  title: string;
  description: string;
  wowMoment?: string;
  route: string;
  selector: string;
  role: DemoRole;
};

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    id: "executive-briefing",
    title: "Executive Briefing Center",
    wowMoment: "AI narrative + war room activation",
    description:
      "Part 2 of the demo arc — cinematic boardroom intelligence, war room mode, and presentation-ready leadership narratives.",
    route: "/admin/briefing",
    selector: "[data-briefing-mode]",
    role: "EXECUTIVE",
  },
  {
    id: "alignment-graph",
    title: "Strategic Alignment Network",
    wowMoment: "Dependency graph + risk propagation",
    description:
      "Visualize execution dependencies, risk propagation, and alignment intelligence across initiatives.",
    route: "/admin/alignment",
    selector: "[data-alignment-graph]",
    role: "EXECUTIVE",
  },
  {
    id: "predictive-forecast",
    title: "Execution Forecast Engine",
    wowMoment: "Scenario simulation + intervention radar",
    description:
      "Part 3 — forward-looking risk radar, scenario simulation, and proactive intervention recommendations.",
    route: "/admin/forecast",
    selector: "[data-predictive-dashboard]",
    role: "EXECUTIVE",
  },
  {
    id: "command-center",
    title: "Leadership Response Center",
    wowMoment: "Fullscreen war room — demo finale",
    description:
      "Live operational pulse, executive alerts, presence, and incident response — the demo finale war room.",
    route: "/admin/command-center",
    selector: "[data-command-center]",
    role: "EXECUTIVE",
  },
  {
    id: "ai-copilot",
    title: "Atom Strategic Advisor",
    wowMoment: "Structured strategic response with leadership action",
    description:
      "Part 4 — executive decision support with strategic language, risk prioritization, and intervention guidance.",
    route: "/admin/executive",
    selector: "[aria-label^='Open Atom Strategic Advisor']",
    role: "EXECUTIVE",
  },
  {
    id: "live-activity",
    title: "Operational Activity Stream",
    description:
      "Real-time organizational activity, escalation propagation, and workforce coordination signals.",
    route: "/admin/activity",
    selector: "[data-live-activity-stream]",
    role: "EXECUTIVE",
  },
  {
    id: "collaboration",
    title: "Workforce Coordination Layer",
    description:
      "Cross-functional initiative rooms — strategic updates, blockers, and leadership decisions in real time.",
    route: "/admin/collaboration",
    selector: "[data-collaboration-spaces]",
    role: "EXECUTIVE",
  },
  {
    id: "executive-dashboard",
    title: "Executive Intelligence Center",
    description:
      "Organizational pulse, AI strategic insights, and leadership recommendations — unified command view.",
    route: "/admin/executive",
    selector: "#overview",
    role: "EXECUTIVE",
  },
];

export const ONBOARDING_TASKS = [
  { id: "explore-employee", label: "Explore workforce execution hub", path: "/employee" },
  { id: "review-approvals", label: "Review leadership approval queue", path: "/manager/approvals" },
  {
    id: "executive-view",
    label: "Open Executive Intelligence Center",
    path: "/admin/executive",
  },
  {
    id: "check-escalations",
    label: "Inspect risk & escalation command",
    path: "/admin/escalations",
  },
  { id: "run-spotlight", label: "Complete judge demo spotlight tour", path: "" },
] as const;

export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}
