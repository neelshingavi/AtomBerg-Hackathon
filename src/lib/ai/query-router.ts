export type QueryIntent =
  | "org_health"
  | "underperforming_depts"
  | "escalations"
  | "managers"
  | "at_risk"
  | "blocked_goals"
  | "bottlenecks"
  | "what_changed"
  | "leadership_attention"
  | "strategic_failures"
  | "graph_alignment"
  | "graph_dependencies"
  | "graph_risk"
  | "predictive_forecast"
  | "predictive_intervention"
  | "predictive_failure"
  | "executive_briefing"
  | "general";

const PATTERNS: Array<{ intent: QueryIntent; patterns: RegExp[] }> = [
  {
    intent: "org_health",
    patterns: [/summarize.*(health|organization)/i, /organization health/i, /org.*health/i, /overall.*health/i],
  },
  {
    intent: "underperforming_depts",
    patterns: [/which departments.*under/i, /underperform/i, /declining departments/i, /worst department/i, /lagging/i],
  },
  {
    intent: "escalations",
    patterns: [/escalation/i, /why.*escalat/i, /escalat.*increas/i],
  },
  {
    intent: "managers",
    patterns: [/which managers/i, /manager.*intervention/i, /manager.*attention/i, /manager.*effectiveness/i],
  },
  {
    intent: "at_risk",
    patterns: [/at.?risk/i, /which employees/i, /workforce risk/i],
  },
  {
    intent: "blocked_goals",
    patterns: [/blocked/i, /what goals.*block/i, /stuck.*goal/i, /pending approval/i],
  },
  {
    intent: "bottlenecks",
    patterns: [/bottleneck/i, /execution bottleneck/i, /operational bottleneck/i, /delayed approval/i],
  },
  {
    intent: "what_changed",
    patterns: [/what changed/i, /this week/i, /last week/i, /delta/i, /trend/i],
  },
  {
    intent: "leadership_attention",
    patterns: [/leadership attention/i, /requires attention/i, /what requires/i, /priorit/i],
  },
  {
    intent: "strategic_failures",
    patterns: [/strategic.*fail/i, /initiative.*fail/i, /shared goal/i],
  },
  {
    intent: "graph_alignment",
    patterns: [
      /why is .* at risk/i,
      /which managers affect/i,
      /alignment graph/i,
      /organizational alignment/i,
      /strategic linkage/i,
    ],
  },
  {
    intent: "graph_dependencies",
    patterns: [
      /dependency bottleneck/i,
      /blocked.*goal/i,
      /dependency chain/i,
      /what goals.*block/i,
      /show dependency/i,
    ],
  },
  {
    intent: "graph_risk",
    patterns: [/risk propagat/i, /downstream goal/i, /ripple effect/i, /spreading risk/i],
  },
  {
    intent: "predictive_forecast",
    patterns: [
      /predict/i,
      /forecast/i,
      /next quarter/i,
      /next cycle/i,
      /likely to happen/i,
      /projection/i,
      /trajectory/i,
    ],
  },
  {
    intent: "predictive_failure",
    patterns: [
      /likely to fail/i,
      /what.*fail/i,
      /emerging risk/i,
      /proactive intervention/i,
      /overloaded/i,
    ],
  },
  {
    intent: "predictive_intervention",
    patterns: [/intervention/i, /what should we do/i, /how should leadership/i, /prevent/i],
  },
  {
    intent: "executive_briefing",
    patterns: [
      /executive briefing/i,
      /boardroom/i,
      /leadership narrative/i,
      /daily briefing/i,
      /weekly summary/i,
      /war room/i,
    ],
  },
];

export function classifyQuery(message: string): QueryIntent {
  const normalized = message.trim().toLowerCase();
  for (const { intent, patterns } of PATTERNS) {
    if (patterns.some((p) => p.test(normalized))) return intent;
  }
  return "general";
}

export const SUGGESTED_PROMPTS = [
  "Summarize organization health",
  "Which departments are underperforming?",
  "Why are escalations increasing?",
  "Which managers need intervention?",
  "Show organization risks",
  "What requires leadership attention?",
  "Show execution bottlenecks",
  "What changed this week?",
  "Why is Engineering at risk?",
  "Show dependency bottlenecks",
  "Which managers affect Revenue Growth?",
  "Give me the executive briefing for this cycle",
];
