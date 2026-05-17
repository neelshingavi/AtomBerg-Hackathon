export type DemoRole = "EMPLOYEE" | "MANAGER" | "ADMIN" | "EXECUTIVE";

export const DEMO_PASSWORD = "password123";

export const DEMO_ACCOUNTS: Record<
  DemoRole,
  { email: string; label: string; description: string; landingPath: string }
> = {
  EMPLOYEE: {
    email: "employee@demo.com",
    label: "Employee",
    description: "Create goals, log check-ins, track achievements",
    landingPath: "/employee",
  },
  MANAGER: {
    email: "manager@demo.com",
    label: "Manager",
    description: "Approve goals, monitor team performance",
    landingPath: "/manager",
  },
  ADMIN: {
    email: "admin@demo.com",
    label: "Admin",
    description: "Configure org, cycles, users, automation",
    landingPath: "/admin",
  },
  EXECUTIVE: {
    email: "admin@demo.com",
    label: "Executive",
    description: "Organization health, risk, strategic alignment",
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

/** Recommended judge presentation flow (documented order) */
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
  route: string;
  selector: string;
  role: DemoRole;
};

export const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    id: "executive-briefing",
    title: "Executive Briefing Mode",
    description:
      "Cinematic boardroom intelligence — AI narratives, war room, KPI ticker, and presentation-ready leadership storytelling.",
    route: "/admin/briefing",
    selector: "[data-briefing-mode]",
    role: "EXECUTIVE",
  },
  {
    id: "alignment-graph",
    title: "Strategic Alignment Graph",
    description:
      "Interactive execution intelligence — dependencies, risk propagation, and war-room visualization.",
    route: "/admin/alignment",
    selector: "[data-alignment-graph]",
    role: "EXECUTIVE",
  },
  {
    id: "predictive-forecast",
    title: "Predictive Risk & Forecasting",
    description:
      "Forward-looking execution intelligence — forecast risks, simulate scenarios, intervene before failures.",
    route: "/admin/forecast",
    selector: "[data-predictive-dashboard]",
    role: "EXECUTIVE",
  },
  {
    id: "command-center",
    title: "Operations Command Center",
    description:
      "Live mission control — real-time pulse, executive alerts, presence, and incident response mode.",
    route: "/admin/command-center",
    selector: "[data-command-center]",
    role: "EXECUTIVE",
  },
  {
    id: "ai-copilot",
    title: "AI Executive Copilot",
    description:
      "Ask natural-language questions about org health, risks, and leadership priorities — context-aware intelligence.",
    route: "/admin/executive",
    selector: "[aria-label='Open Atom AI Copilot']",
    role: "EXECUTIVE",
  },
  {
    id: "live-activity",
    title: "Real-Time Collaboration",
    description:
      "Live organizational activity stream, executive alerts, and operational coordination.",
    route: "/admin/activity",
    selector: "[data-live-activity-stream]",
    role: "EXECUTIVE",
  },
  {
    id: "collaboration",
    title: "Initiative Collaboration Spaces",
    description:
      "Cross-functional rooms for strategic initiatives — updates, blockers, and decisions in real time.",
    route: "/admin/collaboration",
    selector: "[data-collaboration-spaces]",
    role: "EXECUTIVE",
  },
  {
    id: "executive-dashboard",
    title: "Executive Intelligence Dashboard",
    description:
      "Organization health KPIs, workforce risk, alignment, and leadership recommendations in one view.",
    route: "/admin/executive",
    selector: "#overview",
    role: "EXECUTIVE",
  },
];

export const ONBOARDING_TASKS = [
  { id: "explore-employee", label: "Explore employee dashboard", path: "/employee" },
  { id: "review-approvals", label: "Review pending approvals", path: "/manager/approvals" },
  { id: "executive-view", label: "View executive intelligence", path: "/admin/executive" },
  { id: "check-escalations", label: "Inspect escalation center", path: "/admin/escalations" },
  { id: "run-spotlight", label: "Complete feature spotlight tour", path: "" },
] as const;

export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}
