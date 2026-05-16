"use client";

export const CHART_COLORS = [
  "#4f6ef7",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

export const chartTooltipStyle = {
  contentStyle: {
    borderRadius: "10px",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontSize: "12px",
  },
};

export const gradientDefs = (
  <defs>
    <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#4f6ef7" stopOpacity={0.35} />
      <stop offset="100%" stopColor="#4f6ef7" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
    </linearGradient>
  </defs>
);
