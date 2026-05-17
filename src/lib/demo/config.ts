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
  | "executive-dashboard"
  | "alignment-tree"
  | "risk-engine"
  | "escalations"
  | "audit-replay"
  | "automation-builder";

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
    id: "executive-dashboard",
    title: "Executive Intelligence",
    description:
      "Organization health KPIs, workforce risk signals, and execution insights in one command view.",
    route: "/admin/executive",
    selector: "#overview",
    role: "EXECUTIVE",
  },
  {
    id: "alignment-tree",
    title: "Strategic Alignment",
    description:
      "Visualize how departmental goals cascade from thrust areas to individual contributors.",
    route: "/admin/executive",
    selector: "#alignment",
    role: "EXECUTIVE",
  },
  {
    id: "risk-engine",
    title: "Workforce Risk Engine",
    description:
      "Proactive risk scoring identifies at-risk employees and operational bottlenecks before quarter-end.",
    route: "/admin/executive",
    selector: "#insights",
    role: "EXECUTIVE",
  },
  {
    id: "escalations",
    title: "Escalation Intelligence",
    description:
      "Automated escalation rules surface delayed approvals and missed check-ins to leadership.",
    route: "/admin/escalations",
    selector: "[data-spotlight='escalations']",
    role: "ADMIN",
  },
  {
    id: "audit-replay",
    title: "Audit Replay",
    description:
      "Immutable audit trail with entity timelines for compliance and governance reviews.",
    route: "/admin/audit-log",
    selector: "[data-spotlight='audit-log']",
    role: "ADMIN",
  },
  {
    id: "automation-builder",
    title: "Automation Builder",
    description:
      "No-code workflow rules trigger notifications, escalations, and Teams alerts on business events.",
    route: "/admin/automation",
    selector: "[data-spotlight='automation']",
    role: "ADMIN",
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
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.NODE_ENV === "development"
  );
}
