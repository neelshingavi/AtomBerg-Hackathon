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
    patterns: [/strategic.*fail/i, /initiative.*fail/i, /shared goal/i, /alignment/i],
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
];
