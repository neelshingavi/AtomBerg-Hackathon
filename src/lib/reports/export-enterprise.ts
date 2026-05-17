import * as XLSX from "xlsx";
import type { AchievementReportRow } from "./achievement";

const BRAND = {
  primary: "2563EB",
  headerBg: "1E3A5F",
  headerFg: "FFFFFF",
  altRow: "F1F5F9",
  success: "059669",
  warning: "D97706",
  danger: "DC2626",
};

export function buildEnterpriseWorkbook(params: {
  rows: AchievementReportRow[];
  cycleName: string;
  summary: {
    totalEmployees: number;
    totalGoals: number;
    avgCompletion?: number;
    atRiskCount?: number;
  };
  reportTitle?: string;
}): Buffer {
  const { rows, cycleName, summary, reportTitle = "Achievement Report" } = params;
  const wb = XLSX.utils.book_new();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal";

  const coverData = [
    [appName],
    ["Organizational Performance Report"],
    [""],
    ["Report Type", reportTitle],
    ["Performance Cycle", cycleName],
    ["Generated", new Date().toLocaleString()],
    [""],
    ["Organization Overview"],
    ["Total Employees", summary.totalEmployees],
    ["Total Goals", summary.totalGoals],
    ...(summary.avgCompletion != null
      ? [["Avg Completion (%)", Math.round(summary.avgCompletion)]]
      : []),
    ...(summary.atRiskCount != null
      ? [["At-Risk Employees", summary.atRiskCount]]
      : []),
    [""],
    ["Confidential — Internal Use Only"],
  ];
  const coverWs = XLSX.utils.aoa_to_sheet(coverData);
  coverWs["!cols"] = [{ wch: 28 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, coverWs, "Cover");

  const ws = XLSX.utils.json_to_sheet(rows);
  const colCount = rows[0] ? Object.keys(rows[0]).length : 10;
  ws["!cols"] = Array(colCount).fill({ wch: 16 });
  ws["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(colCount - 1)}${rows.length + 1}` };
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  const byDept = groupBy(rows, "Department");
  const deptSummary = Object.entries(byDept).map(([dept, deptRows]) => ({
    Department: dept,
    Employees: new Set(deptRows.map((r) => r["Employee Code"])).size,
    Goals: deptRows.length,
    "Avg Score":
      avgScore(deptRows) != null ? `${Math.round(avgScore(deptRows)!)}%` : "—",
  }));
  if (deptSummary.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(deptSummary),
      "By Department"
    );
  }

  const byManager = groupBy(rows, "Manager");
  const mgrSummary = Object.entries(byManager).map(([mgr, mgrRows]) => ({
    Manager: mgr,
    Employees: new Set(mgrRows.map((r) => r["Employee Code"])).size,
    Goals: mgrRows.length,
    "Avg Score":
      avgScore(mgrRows) != null ? `${Math.round(avgScore(mgrRows)!)}%` : "—",
  }));
  if (mgrSummary.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mgrSummary), "By Manager");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function groupBy(rows: AchievementReportRow[], key: string) {
  return rows.reduce<Record<string, AchievementReportRow[]>>((acc, row) => {
    const k = String(row[key] ?? "—");
    (acc[k] ??= []).push(row);
    return acc;
  }, {});
}

function avgScore(rows: AchievementReportRow[]): number | null {
  const scores: number[] = [];
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (k.includes("Score") && typeof v === "number") scores.push(v);
    }
  }
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export { BRAND };
