/** Natural-language shortcuts for command palette */
export type SemanticRoute = {
  id: string;
  phrases: string[];
  label: string;
  href: string;
  roles: Array<"EMPLOYEE" | "MANAGER" | "ADMIN">;
};

export const SEMANTIC_ROUTES: SemanticRoute[] = [
  {
    id: "risks",
    phrases: ["show risks", "risk forecast", "predictive", "forecast risks"],
    label: "Predictive risk forecast",
    href: "/admin/forecast",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "approvals",
    phrases: ["pending approvals", "review approvals", "approval queue", "delayed goals"],
    label: "Pending approvals",
    href: "/manager/approvals",
    roles: ["MANAGER", "ADMIN"],
  },
  {
    id: "briefing",
    phrases: ["executive briefing", "boardroom", "leadership briefing"],
    label: "Executive briefing",
    href: "/admin/briefing",
    roles: ["ADMIN"],
  },
  {
    id: "alignment",
    phrases: ["alignment graph", "dependencies", "strategic alignment"],
    label: "Alignment graph",
    href: "/admin/alignment",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "command",
    phrases: ["command center", "war room", "live operations", "operations center"],
    label: "Operations command center",
    href: "/admin/command-center",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "escalations",
    phrases: ["escalations", "show escalations", "escalation spike"],
    label: "Escalation center",
    href: "/admin/escalations",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "executive",
    phrases: ["executive dashboard", "org health", "organization health"],
    label: "Executive intelligence",
    href: "/admin/executive",
    roles: ["ADMIN"],
  },
  {
    id: "analytics",
    phrases: ["engineering analytics", "analytics", "department analytics"],
    label: "Executive analytics",
    href: "/admin/analytics",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "collaboration",
    phrases: ["collaboration", "initiative room", "team spaces"],
    label: "Collaboration spaces",
    href: "/admin/collaboration",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    id: "audit",
    phrases: ["audit log", "compliance", "audit trail"],
    label: "Audit log",
    href: "/admin/audit-log",
    roles: ["ADMIN"],
  },
];

export function matchSemanticRoute(
  query: string,
  role: "EMPLOYEE" | "MANAGER" | "ADMIN"
): SemanticRoute | null {
  const q = query.toLowerCase().trim();
  for (const route of SEMANTIC_ROUTES) {
    if (!route.roles.includes(role)) continue;
    if (route.phrases.some((p) => q.includes(p) || p.includes(q))) return route;
  }
  return null;
}
