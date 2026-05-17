export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function linearTrend(values: number[]): { slope: number; intercept: number } {
  if (values.length < 2) return { slope: 0, intercept: values[0] ?? 50 };
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function projectValue(
  history: number[],
  stepsAhead: number
): { value: number; confidence: number } {
  if (history.length === 0) return { value: 50, confidence: 40 };
  const { slope, intercept } = linearTrend(history);
  const projected = clamp(intercept + slope * (history.length - 1 + stepsAhead));
  const variance =
    history.length > 1
      ? history.reduce((s, v, i) => {
          const pred = intercept + slope * i;
          return s + (v - pred) ** 2;
        }, 0) / history.length
      : 10;
  const confidence = clamp(92 - Math.sqrt(variance) * 2 - (history.length < 4 ? 15 : 0), 45, 95);
  return { value: Math.round(projected * 10) / 10, confidence: Math.round(confidence) };
}

export function velocityScore(history: number[]): number {
  if (history.length < 2) return 0;
  const recent = history.slice(-3);
  const older = history.slice(0, Math.max(1, history.length - 3));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  return Math.round((recentAvg - olderAvg) * 10) / 10;
}

export function probabilityFromSignals(signals: Array<{ weight: number; active: boolean }>): number {
  const total = signals.reduce((s, sig) => s + (sig.active ? sig.weight : 0), 0);
  const max = signals.reduce((s, sig) => s + sig.weight, 0);
  return max > 0 ? clamp(Math.round((total / max) * 100), 5, 98) : 20;
}

export function severityFromProbability(p: number): "low" | "medium" | "high" | "critical" {
  if (p >= 80) return "critical";
  if (p >= 60) return "high";
  if (p >= 40) return "medium";
  return "low";
}

export function formatHorizon(horizon: string): string {
  switch (horizon) {
    case "30d":
      return "next 30 days";
    case "90d":
      return "next 90 days";
    case "quarter":
      return "next quarter";
    default:
      return "this cycle";
  }
}
