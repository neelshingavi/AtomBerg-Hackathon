/**
 * Demo-safe fallback payloads — keeps intelligence surfaces alive if APIs fail.
 * Enterprise-realistic copy for judge presentations.
 */
import type {
  AnomalyAlert,
  ExecutiveBriefing,
  IntelligenceInsight,
  LeadershipRecommendation,
  OrganizationPulse,
} from "@/lib/intelligence/types";

export const DEMO_FALLBACK_PULSE: OrganizationPulse = {
  overallScore: 72,
  state: "watchlist",
  stateLabel: "Watchlist",
  confidence: 91,
  trendPct: -3,
  previousScore: 75,
  narrative:
    "Approval latency in Operations and Supply Chain may impact Q3 execution targets if leadership intervention is delayed. Cross-functional alignment on Revenue Growth remains strong.",
  factors: [
    { key: "completion", label: "Goal completion velocity", score: 78, weight: 0.22, trend: "down" },
    { key: "alignment", label: "Strategic alignment", score: 81, weight: 0.2, trend: "stable" },
    { key: "escalations", label: "Escalation control", score: 64, weight: 0.18, trend: "down" },
    { key: "checkins", label: "Progress signal cadence", score: 70, weight: 0.15, trend: "stable" },
    { key: "approvals", label: "Approval throughput", score: 58, weight: 0.15, trend: "down" },
    { key: "risk", label: "Workforce risk index", score: 68, weight: 0.1, trend: "up" },
  ],
  departments: [
    {
      id: "ops",
      name: "Operations",
      score: 58,
      state: "at_risk",
      trendPct: -8,
      narrative: "Approval bottleneck affecting 12 strategic initiatives.",
    },
    {
      id: "eng",
      name: "Engineering",
      score: 84,
      state: "healthy",
      trendPct: 2,
      narrative: "On track for platform modernization thrust area.",
    },
    {
      id: "rev",
      name: "Revenue",
      score: 79,
      state: "healthy",
      trendPct: 1,
      narrative: "Revenue Growth initiative aligned with corporate OKRs.",
    },
  ],
  managers: [],
  cycleScore: 72,
  sparkline: [75, 74, 73, 72, 71, 72, 72],
};

export const DEMO_FALLBACK_INSIGHTS: IntelligenceInsight[] = [
  {
    id: "fb-1",
    priority: "critical",
    category: "approval",
    title: "Operations approval latency elevated",
    body: "Average manager approval time increased 34% week-over-week. Three strategic initiatives are blocked pending sign-off.",
    metric: "4.2 days avg",
    trendPct: 34,
    recommendation: "Authorize expedited approval protocol for Q3 critical path goals",
    affectedDepartments: ["Operations", "Supply Chain"],
    confidence: 93,
  },
  {
    id: "fb-2",
    priority: "warning",
    category: "alignment",
    title: "Dependency risk on Revenue Growth initiative",
    body: "Downstream goals in Customer Success depend on Engineering deliverables due in 9 days.",
    recommendation: "Schedule cross-functional leadership sync",
    affectedDepartments: ["Revenue", "Engineering"],
    confidence: 88,
  },
];

export const DEMO_FALLBACK_RECOMMENDATIONS: LeadershipRecommendation[] = [
  {
    id: "fb-rec-1",
    title: "Expedite Operations approval queue",
    description:
      "Approval latency threatens quarterly execution targets. Leadership intervention can unblock 12 initiatives within 48 hours.",
    urgency: "high",
    confidence: 92,
    impact: "high",
    affectedCount: 12,
    departments: ["Operations"],
    actionLabel: "Open Leadership Response Center",
    href: "/admin/command-center",
    factors: ["Approval SLA breach", "Blocked strategic goals"],
  },
  {
    id: "fb-rec-2",
    title: "Convene Revenue Growth alignment review",
    description:
      "Cross-functional dependency chain requires executive prioritization to prevent cascade delay.",
    urgency: "medium",
    confidence: 87,
    impact: "medium",
    departments: ["Revenue", "Engineering"],
    actionLabel: "View Strategic Alignment Network",
    href: "/admin/alignment",
    factors: ["Dependency bottleneck", "Initiative interlock"],
  },
];

export const DEMO_FALLBACK_ANOMALIES: AnomalyAlert[] = [
  {
    id: "fb-an-1",
    type: "escalation_spike",
    title: "Escalation volume spike in Operations",
    description: "Unresolved escalations up 28% vs prior period — correlates with approval delays.",
    severity: "warning",
    deltaPct: 28,
    currentValue: 14,
    previousValue: 11,
    confidence: 90,
  },
];

export const DEMO_FALLBACK_BRIEFING: ExecutiveBriefing = {
  id: "demo-briefing",
  type: "organization",
  title: "Executive Intelligence Summary — Active Cycle",
  generatedAt: new Date().toISOString(),
  summary:
    "Organizational pulse is in watchlist territory. Operations approval latency is the primary execution risk; Revenue Growth alignment remains a strength. Leadership should prioritize bottleneck clearance before week-end planning.",
  developments: [
    "Operations approval queue grew 34% — 12 initiatives blocked",
    "Engineering on track for platform modernization milestone",
    "Escalation volume in Operations up 28% week-over-week",
  ],
  risks: [
    "Q3 target exposure if Operations approvals not cleared within 48h",
    "Cascade delay risk on Revenue Growth dependent goals",
  ],
  recommendations: [
    "Authorize expedited approval protocol for critical path goals",
    "Convene cross-functional sync on Revenue Growth dependencies",
  ],
  nextActions: [
    "Review Leadership Response Center for live operational pulse",
    "Open Execution Forecast Engine for forward-looking scenarios",
  ],
};

export const DEMO_FALLBACK_COPILOT_SUMMARY =
  "Organizational pulse is at watchlist (72/100). Approval latency in Operations poses the highest near-term execution risk to quarterly targets. Recommend expedited leadership intervention on the approval queue and a cross-functional alignment review for Revenue Growth dependencies.";
