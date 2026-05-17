import type { CopilotResponse } from "@/lib/intelligence/types";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import type { OrganizationPulse } from "@/lib/intelligence/types";
import { kpiMap } from "@/lib/intelligence/snapshot";
import { classifyQuery, type QueryIntent } from "./query-router";
import { buildWhatChanged } from "./what-changed";
import { generateLeadershipRecommendations } from "@/lib/recommendations/engine";
import { detectAnomalies } from "@/lib/anomaly-detection/detector";
import { enhanceWithOpenAI } from "./openai";
import type { PredictiveSnapshot } from "@/lib/predictive-engine/types";

export async function generateCopilotResponse(params: {
  message: string;
  snapshot: IntelligenceSnapshot;
  pulse: OrganizationPulse;
  contextText: string;
  predictive?: PredictiveSnapshot;
}): Promise<CopilotResponse> {
  const intent = classifyQuery(params.message);
  const structured = buildStructuredResponse(
    intent,
    params.snapshot,
    params.pulse,
    params.predictive
  );

  const enhanced = await enhanceWithOpenAI({
    userMessage: params.message,
    context: params.contextText,
    structured,
  });

  return enhanced ?? structured;
}

function buildStructuredResponse(
  intent: QueryIntent,
  snapshot: IntelligenceSnapshot,
  pulse: OrganizationPulse,
  predictive?: PredictiveSnapshot
): CopilotResponse {
  const kpis = kpiMap(snapshot);
  const recs = generateLeadershipRecommendations(snapshot);
  const anomalies = detectAnomalies(snapshot);
  const changes = buildWhatChanged(snapshot);

  const base = {
    metrics: [
      { label: "Organization Pulse", value: `${pulse.overallScore}/100` },
      { label: "Goal Completion", value: `${kpis.orgGoalCompletion ?? 0}%` },
      { label: "Active Escalations", value: kpis.activeEscalations ?? 0 },
      { label: "At-Risk Employees", value: kpis.atRiskEmployees ?? 0 },
    ],
    recommendations: recs.slice(0, 3).map((r) => r.title),
    affectedDepartments: [] as string[],
    affectedManagers: [] as string[],
    urgency: "medium" as const,
    confidence: pulse.confidence,
    factors: pulse.factors.map((f) => ({
      factor: f.label,
      contribution: Math.round(f.score * f.weight),
    })),
  };

  switch (intent) {
    case "org_health":
      return {
        ...base,
        summary: pulse.narrative,
        reasoning: [
          `Weighted health score: ${pulse.overallScore}/100 (${pulse.stateLabel})`,
          `Goal completion at ${kpis.orgGoalCompletion ?? 0}% drives ${Math.round((kpis.orgGoalCompletion ?? 0) * 0.22)} contribution points`,
          `${kpis.activeEscalations ?? 0} active escalations impact escalation control factor`,
        ],
        urgency: pulse.state === "critical" || pulse.state === "at_risk" ? "high" : "medium",
      };

    case "underperforming_depts": {
      const worst = [...snapshot.executive.departmentHealth].sort(
        (a, b) => a.completionPct - b.completionPct
      );
      const names = worst.slice(0, 3).map((d) => d.department);
      return {
        ...base,
        summary: `${names.join(", ")} are the lowest-performing departments by completion rate.`,
        reasoning: worst.slice(0, 3).map(
          (d) =>
            `${d.department}: ${d.completionPct}% completion, ${d.delayedCheckins} delayed check-ins, health ${d.healthStatus}`
        ),
        affectedDepartments: names,
        urgency: worst[0]?.healthStatus === "critical" ? "critical" : "high",
        confidence: 91,
      };
    }

    case "escalations": {
      const top = [...snapshot.escalations.byDepartment].sort((a, b) => b.unresolved - a.unresolved)[0];
      const trend = anomalies.find((a) => a.type === "escalation_spike");
      return {
        ...base,
        summary: trend
          ? trend.description
          : `${snapshot.escalations.unresolvedCount} unresolved escalations. ${top ? `${top.department} has the highest density (${top.unresolved}).` : ""}`,
        reasoning: [
          `Manager SLA compliance: ${snapshot.escalations.managerSlaCompliance}%`,
          `Average resolution: ${snapshot.escalations.avgResolutionDays} days`,
          ...(top ? [`${top.department}: ${top.unresolved} open escalations`] : []),
        ],
        affectedDepartments: top ? [top.department] : [],
        urgency: (kpis.activeEscalations ?? 0) > 10 ? "critical" : "high",
        confidence: 90,
      };
    }

    case "managers": {
      const need = snapshot.managerRisks.filter((m) => m.score > 45).slice(0, 5);
      return {
        ...base,
        summary:
          need.length > 0
            ? `${need.map((m) => m.name).join(", ")} require intervention based on delayed reviews and team risk.`
            : "Manager cohort is performing within acceptable SLA thresholds.",
        reasoning: need.map(
          (m) => `${m.name}: risk ${m.score} — ${m.factors.map((f) => f.label).join(", ")}`
        ),
        affectedManagers: need.map((m) => m.name),
        urgency: need.length > 2 ? "high" : "medium",
        confidence: 87,
      };
    }

    case "at_risk": {
      const critical = snapshot.employeeRisks.filter((e) => e.level !== "healthy");
      return {
        ...base,
        summary: `${critical.length} employees flagged at elevated risk. ${critical.filter((e) => e.level === "critical").length} in critical band.`,
        reasoning: critical.slice(0, 5).map(
          (e) => `${e.name} (${e.department ?? "—"}): score ${e.score} — ${e.factors.map((f) => f.label).join(", ")}`
        ),
        affectedDepartments: Array.from(
          new Set(critical.map((e) => e.department).filter(Boolean) as string[])
        ),
        urgency: critical.some((e) => e.level === "critical") ? "critical" : "high",
        confidence: 92,
      };
    }

    case "blocked_goals": {
      const delayed = kpis.delayedApprovals ?? 0;
      const submitted = snapshot.executive.departmentHealth.reduce((s, d) => s + d.delayedApprovals, 0);
      return {
        ...base,
        summary: `${delayed} goal sheets are blocked in approval pipeline beyond SLA. ${submitted} department-level approval delays detected.`,
        reasoning: [
          "Submitted sheets awaiting manager review beyond 5-day SLA",
          "Unlock requests and rework cycles may add secondary blocks",
        ],
        urgency: delayed > 8 ? "high" : "medium",
        confidence: 88,
      };
    }

    case "bottlenecks":
      return {
        ...base,
        summary: `Primary bottlenecks: approval latency (${kpis.delayedApprovals ?? 0} delayed), escalations (${kpis.activeEscalations ?? 0} active), and at-risk check-ins (${kpis.atRiskEmployees ?? 0} employees).`,
        reasoning: recs.slice(0, 3).map((r) => r.description),
        urgency: "high",
        confidence: 89,
      };

    case "what_changed":
      return {
        ...base,
        summary: changes.executiveSummary,
        reasoning: changes.items.map((i) => i.interpretation),
        urgency: changes.items.some((i) => i.direction === "down" && i.deltaPct < -15) ? "high" : "medium",
        confidence: 86,
      };

    case "leadership_attention":
      return {
        ...base,
        summary: recs[0]?.title ?? "No critical leadership actions at this time.",
        reasoning: recs.slice(0, 4).map((r) => r.description),
        recommendations: recs.slice(0, 5).map((r) => r.title),
        affectedDepartments: recs.flatMap((r) => r.departments ?? []).slice(0, 4),
        affectedManagers: recs.flatMap((r) => r.managers ?? []).slice(0, 4),
        urgency: recs[0]?.urgency ?? "medium",
        confidence: 90,
      };

    case "strategic_failures":
      return {
        ...base,
        summary: `Shared goal adoption at ${kpis.sharedGoalAdoption ?? 0}%. ${(kpis.sharedGoalAdoption ?? 0) < 40 ? "Strategic initiatives show adoption gaps — cross-functional alignment at risk." : "Strategic alignment metrics are within target range."}`,
        reasoning: [
          `Shared goal adoption: ${kpis.sharedGoalAdoption ?? 0}%`,
          `Org completion: ${kpis.orgGoalCompletion ?? 0}%`,
        ],
        urgency: (kpis.sharedGoalAdoption ?? 0) < 30 ? "high" : "low",
        confidence: 84,
      };

    case "graph_alignment": {
      const eng = snapshot.executive.departmentHealth.find((d) =>
        /engineer/i.test(d.department)
      );
      return {
        ...base,
        summary: eng
          ? `Engineering shows ${eng.completionPct}% completion with health status ${eng.healthStatus}. ${eng.escalationCount} escalations and ${eng.delayedApprovals} delayed approvals impact strategic execution.`
          : `Organization alignment score driven by ${kpis.sharedGoalAdoption ?? 0}% shared goal adoption. Review the Alignment Graph for strategic linkage density.`,
        reasoning: snapshot.executive.departmentHealth.slice(0, 4).map(
          (d) => `${d.department}: ${d.completionPct}% completion, risk ${d.riskScore}`
        ),
        affectedDepartments: snapshot.executive.departmentHealth
          .filter((d) => d.healthStatus !== "healthy")
          .map((d) => d.department)
          .slice(0, 4),
        urgency: eng?.healthStatus === "critical" ? "high" : "medium",
        confidence: 88,
      };
    }

    case "graph_dependencies":
      return {
        ...base,
        summary: `Execution bottlenecks detected in approval queues (${kpis.delayedApprovals ?? 0} delayed) and goal dependencies. Open Alignment Graph → Dependency mode to visualize blocked chains and critical paths.`,
        reasoning: recs
          .filter((r) => r.title.toLowerCase().includes("approv") || r.title.toLowerCase().includes("bottleneck"))
          .slice(0, 3)
          .map((r) => r.description),
        urgency: "high",
        confidence: 87,
      };

    case "graph_risk":
      return {
        ...base,
        summary: `${kpis.atRiskEmployees ?? 0} at-risk employees may propagate execution risk to downstream goals and departments. Risk propagation is visualized in Alignment Graph → Risk view.`,
        reasoning: snapshot.employeeRisks
          .slice(0, 5)
          .map((e) => `${e.name}: risk ${e.score} (${e.level})`),
        affectedDepartments: Array.from(
          new Set(snapshot.employeeRisks.map((e) => e.department).filter(Boolean))
        ).slice(0, 4) as string[],
        urgency: "high",
        confidence: 86,
      };

    case "executive_briefing":
      return {
        ...base,
        summary:
          "Open Executive Briefing Mode for AI-generated daily, weekly, and quarterly narratives, leadership priorities, war room, and presentation-ready boardroom storytelling.",
        reasoning: [
          "Navigate to /admin/briefing for the primary demo experience.",
          "Includes KPI ticker, insight carousel, department storyboards, and timeline replay.",
        ],
        recommendations: [
          "Launch War Room for fullscreen operational command view.",
          "Use Presentation mode to walk judges through the organization.",
        ],
        urgency: "medium",
        confidence: 92,
      };

    case "predictive_forecast":
    case "predictive_failure": {
      if (predictive) {
        const top = predictive.predictions[0];
        return {
          ...base,
          summary: predictive.executiveNarrative,
          reasoning: [
            ...predictive.predictions.slice(0, 4).map(
              (p) =>
                `${p.title}: ${p.probability}% probability (${p.confidence}% confidence) — ${p.projectedImpact}`
            ),
            ...predictive.earlyWarnings.slice(0, 2).map((w) => w.message),
          ],
          recommendations: predictive.interventions.slice(0, 3).map((i) => i.title),
          affectedDepartments: top?.affectedDepartments ?? [],
          affectedManagers: top?.affectedManagers ?? [],
          urgency: predictive.overallRiskOutlook === "critical" ? "critical" : "high",
          confidence: top?.confidence ?? 82,
          factors: top?.factors.map((f) => ({
            factor: f.factor,
            contribution: f.weight,
          })),
        };
      }
      return {
        ...base,
        summary: "Open Predictive Forecast dashboard for forward-looking risk and completion projections.",
        reasoning: ["Predictive engine available at /admin/forecast"],
        urgency: "medium",
        confidence: 70,
      };
    }

    case "predictive_intervention": {
      if (predictive) {
        return {
          ...base,
          summary: predictive.interventions[0]?.description ?? "Review recommended interventions.",
          reasoning: predictive.interventions.map((i) => `${i.title}: ${i.expectedImpact}`),
          recommendations: predictive.interventions.map((i) => i.title),
          urgency: predictive.interventions[0]?.priority === "critical" ? "critical" : "high",
          confidence: predictive.interventions[0]?.confidence ?? 85,
        };
      }
      return {
        ...base,
        summary: recs[0]?.description ?? "Leadership interventions derived from current risk posture.",
        reasoning: recs.slice(0, 3).map((r) => r.description),
        recommendations: recs.slice(0, 3).map((r) => r.title),
        urgency: "medium",
        confidence: 80,
      };
    }

    default:
      return {
        ...base,
        summary: `${pulse.stateLabel} organization (${pulse.overallScore}/100). ${recs[0]?.description ?? "Review executive dashboard for detailed metrics."}`,
        reasoning: [
          pulse.narrative,
          ...anomalies.slice(0, 2).map((a) => a.description),
        ],
        recommendations: recs.slice(0, 4).map((r) => r.title),
        urgency: pulse.state === "critical" ? "critical" : "medium",
        confidence: 85,
      };
  }
}
