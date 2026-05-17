import { prisma } from "@/lib/prisma";
import type { IntelligenceSnapshot } from "@/lib/intelligence/snapshot";
import type { InitiativeForecast } from "./types";
import { clamp } from "./utils";

export async function forecastInitiatives(
  cycleId: string,
  snapshot: IntelligenceSnapshot
): Promise<InitiativeForecast[]> {
  void snapshot;
  const sharedGoals = await prisma.sharedGoal.findMany({
    where: { cycleId, isActive: true },
    include: {
      thrustArea: { select: { name: true } },
      goals: {
        include: {
          achievements: { where: { cycleId } },
          dependenciesFrom: true,
          dependenciesTo: { where: { type: "BLOCKED_BY" } },
        },
      },
    },
    take: 8,
  });

  return sharedGoals.map((sg) => {
    const linked = sg.goals;
    const progress =
      linked.length > 0
        ? linked.reduce((s, g) => {
            const latest = [...g.achievements].sort((a, b) =>
              b.quarter.localeCompare(a.quarter)
            )[0];
            return s + (latest?.progressScore ?? 0) * 100;
          }, 0) / linked.length
        : 0;

    const blocked = linked.filter((g) => g.dependenciesTo.length > 0).length;
    const atRisk = linked.flatMap((g) => g.achievements).filter((a) => a.status === "AT_RISK").length;
    const adoptionBreadth = linked.length;

    const successProbability = clamp(
      Math.round(
        progress * 0.45 +
          Math.min(100, adoptionBreadth * 12) * 0.2 +
          (100 - blocked * 15) * 0.2 +
          (100 - atRisk * 10) * 0.15
      )
    );

    const riskContributors: string[] = [];
    if (blocked > 0) riskContributors.push(`${blocked} blocked dependencies`);
    if (atRisk > 0) riskContributors.push(`${atRisk} at-risk check-ins`);
    if (linked.length < 3) riskContributors.push("Low cross-team adoption");
    if (progress < 40) riskContributors.push("Below-target execution velocity");

    const projectedDelayDays =
      successProbability < 50 ? Math.round((50 - successProbability) * 0.8) : undefined;

    return {
      id: sg.id,
      title: sg.title,
      successProbability,
      confidence: clamp(72 + Math.min(linked.length * 3, 20), 60, 94),
      riskContributors,
      projectedDelayDays,
      thrustArea: sg.thrustArea.name,
    };
  });
}
