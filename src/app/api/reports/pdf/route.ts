import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { generatePdfReport } from "@/lib/reports/pdf-export";
import { buildExecutiveReport } from "@/lib/reports/executive";
import { prisma } from "@/lib/prisma";

function kpiValue(
  kpis: Array<{ key: string; value: number }>,
  key: string
): number {
  return kpis.find((k) => k.key === key)?.value ?? 0;
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "executive-summary";
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) return apiError("cycleId is required");

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return apiError("Cycle not found", 404);

  if (type === "executive-summary") {
    const report = await buildExecutiveReport(cycleId);
    const buffer = generatePdfReport({
      title: "Executive Summary — Organization Health",
      subtitle: `${cycle.name} · Strategic Alignment Report`,
      type: "executive-summary",
      kpis: [
        {
          label: "Goal Completion Rate",
          value: `${kpiValue(report.kpis, "orgGoalCompletion")}%`,
        },
        {
          label: "Check-in Compliance",
          value: `${kpiValue(report.kpis, "checkinCompliance")}%`,
        },
        {
          label: "At-Risk Employees",
          value: kpiValue(report.kpis, "atRiskEmployees"),
        },
        {
          label: "Delayed Approvals",
          value: kpiValue(report.kpis, "delayedApprovals"),
        },
        {
          label: "Active Escalations",
          value: kpiValue(report.kpis, "activeEscalations"),
        },
        {
          label: "Shared Goal Adoption",
          value: `${kpiValue(report.kpis, "sharedGoalAdoption")}%`,
        },
      ],
      sections: [
        {
          title: "Department Health",
          rows: report.departmentHealth.map((d) => ({
            Department: d.department,
            "Health Status": d.healthStatus,
            "Completion %": `${d.completionPct}%`,
            "Risk Score": d.riskScore,
            "At-Risk Signals": d.delayedCheckins + d.delayedApprovals,
            Escalations: d.escalationCount,
          })),
        },
        {
          title: "Workforce Risk — Top At-Risk",
          rows: report.atRiskEmployees.slice(0, 15).map((e) => ({
            Employee: e.name,
            Department: e.department ?? "—",
            "Risk Score": e.score,
            Level: e.level,
          })),
        },
        {
          title: "Execution Insights",
          rows: report.insights.slice(0, 8).map((i) => ({
            Insight: i.title,
            Type: i.type,
            Detail: i.body.slice(0, 120),
          })),
        },
      ],
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="executive-summary-${cycleId}.pdf"`,
      },
    });
  }

  if (type === "escalation") {
    const logs = await prisma.escalationLog.findMany({
      include: {
        employee: { include: { department: true } },
        rule: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const buffer = generatePdfReport({
      title: "Escalation Intelligence Report",
      subtitle: cycle.name,
      type: "escalation",
      kpis: [
        { label: "Total Escalations", value: logs.length },
        {
          label: "Pending",
          value: logs.filter((l) => l.status === "PENDING").length,
        },
      ],
      sections: [
        {
          title: "Recent Escalations",
          rows: logs.map((l) => ({
            Employee: l.employee.name,
            Department: l.employee.department.name,
            Trigger: l.rule.trigger,
            Status: l.status,
            Date: l.createdAt.toISOString().split("T")[0],
          })),
        },
      ],
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="escalation-report-${cycleId}.pdf"`,
      },
    });
  }

  return apiError("Invalid type. Use executive-summary or escalation");
}
