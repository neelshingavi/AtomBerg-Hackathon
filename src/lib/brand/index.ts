/**
 * Single source of truth for product identity, narrative, and enterprise terminology.
 * Category: AI-Powered Organizational Intelligence Operating System
 */

export const PRODUCT = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "AtomQuest",
  tagline: "Organizational Intelligence OS",
  category: "AI-Powered Organizational Intelligence Operating System",
  mission:
    "Helping organizations predict, align, and execute strategically.",
  vision:
    "The future operating system for organizational execution.",
  copilotName: "Atom Strategic Advisor",
  copilotShort: "Strategic Advisor",
} as const;

export const NAV_LABELS = {
  employee: {
    home: "Execution Hub",
    goals: "My Strategic Goals",
    checkins: "Progress Signals",
    shared: "Cross-Team Initiatives",
    inbox: "Leadership Inbox",
  },
  manager: {
    home: "Team Command View",
    approvals: "Approval Queue",
    team: "Workforce Layer",
    activity: "Operational Activity Stream",
    analytics: "Team Intelligence",
    shared: "Initiative Coordination",
    inbox: "Leadership Inbox",
  },
  intelligence: {
    home: "Command Overview",
    executive: "Executive Intelligence Center",
    briefing: "Executive Briefing Center",
    commandCenter: "Leadership Response Center",
    collaboration: "Workforce Coordination Layer",
    alignment: "Strategic Alignment Network",
    forecast: "Execution Forecast Engine",
    activity: "Operational Activity Stream",
    analytics: "Operational Intelligence",
    escalations: "Risk & Escalation Command",
  },
  administration: {
    users: "Workforce Registry",
    departments: "Organizational Units",
    thrustAreas: "Strategic Thrust Areas",
    cycles: "Execution Cycles",
    achievement: "Achievement Intelligence",
    completion: "Completion Intelligence",
    shared: "Cross-Functional Initiatives",
    automation: "Governance Automation",
    observability: "System Observability",
    architecture: "Platform Architecture",
    integrations: "Enterprise Integrations",
    audit: "Audit & Compliance Trail",
    inbox: "Leadership Inbox",
  },
} as const;

export const DIFFERENTIATION = [
  { not: "Jira / Asana", is: "Strategic execution intelligence, not task tracking" },
  { not: "Excel dashboards", is: "Predictive coordination with live operational context" },
  { not: "HR KPI tools", is: "Cross-functional alignment and workforce orchestration" },
  { not: "Reactive reporting", is: "Proactive intervention before execution failure" },
] as const;

export const DEMO_STORY_ARC = [
  {
    part: 1,
    title: "The Problem",
    description:
      "Fragmented execution, approval latency, and organizational blind spots erode quarterly targets.",
  },
  {
    part: 2,
    title: "The Platform",
    description:
      "Executive Briefing Center, AI Intelligence Layer, Organizational Pulse, Strategic Alignment Network.",
  },
  {
    part: 3,
    title: "Live Intelligence",
    description:
      "Real-time pulse shifts, escalation propagation, predictive forecasting, executive alerts.",
  },
  {
    part: 4,
    title: "Executive Decisions",
    description:
      "AI recommendations, operational interventions, incident response, strategic prioritization.",
  },
  {
    part: 5,
    title: "The Future",
    description:
      "Predictive execution, AI-powered leadership, and workforce orchestration at enterprise scale.",
  },
] as const;

export const FUTURE_OF_WORK_PHRASES = [
  "operational intelligence",
  "strategic execution",
  "organizational visibility",
  "predictive coordination",
  "workforce orchestration",
  "alignment intelligence",
] as const;
