import { buildExecutiveReport } from "@/lib/reports/executive";
import { buildEscalationAnalytics } from "@/lib/reports/escalation-analytics";
import {
  computeEmployeeRisks,
  computeDepartmentRisks,
  computeManagerRisks,
} from "@/lib/risk/engine";
import { prisma } from "@/lib/prisma";
import { getCached, setCache } from "./cache";

export type IntelligenceSnapshot = {
  cycleId: string;
  cycleName: string;
  generatedAt: string;
  executive: Awaited<ReturnType<typeof buildExecutiveReport>>;
  escalations: Awaited<ReturnType<typeof buildEscalationAnalytics>>;
  employeeRisks: Awaited<ReturnType<typeof computeEmployeeRisks>>;
  departmentRisks: Awaited<ReturnType<typeof computeDepartmentRisks>>;
  managerRisks: Awaited<ReturnType<typeof computeManagerRisks>>;
  employeeCount: number;
  managerCount: number;
};

export async function buildIntelligenceSnapshot(
  cycleId: string
): Promise<IntelligenceSnapshot> {
  const cacheKey = `intel:snapshot:${cycleId}`;
  const cached = getCached<IntelligenceSnapshot>(cacheKey);
  if (cached) return cached;

  const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const [executive, escalations, employeeRisks, departmentRisks, managerRisks, employeeCount, managerCount] =
    await Promise.all([
      buildExecutiveReport(cycleId),
      buildEscalationAnalytics({ cycleId }),
      computeEmployeeRisks({ cycleId, limit: 25 }),
      computeDepartmentRisks(cycleId),
      computeManagerRisks(cycleId),
      prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
      prisma.user.count({ where: { role: "MANAGER", isActive: true } }),
    ]);

  const snapshot: IntelligenceSnapshot = {
    cycleId,
    cycleName: cycle.name,
    generatedAt: new Date().toISOString(),
    executive,
    escalations,
    employeeRisks,
    departmentRisks,
    managerRisks,
    employeeCount,
    managerCount,
  };

  setCache(cacheKey, snapshot, 45_000);
  return snapshot;
}

export function kpiMap(snapshot: IntelligenceSnapshot): Record<string, number> {
  return Object.fromEntries(
    snapshot.executive.kpis.map((k) => [k.key, k.value])
  ) as Record<string, number>;
}
