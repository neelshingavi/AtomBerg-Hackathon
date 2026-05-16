import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { apiError } from "@/lib/api-response";
import { requireSession, requireRoles } from "@/lib/api-auth";
import { buildAchievementReport } from "@/lib/reports/achievement";
export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const roleError = requireRoles(session, ["ADMIN", "MANAGER"]);
  if (roleError) return roleError;

  const { searchParams } = req.nextUrl;
  const cycleId = searchParams.get("cycleId");
  const format = searchParams.get("format") ?? "json";
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const quarter = searchParams.get("quarter");

  if (!cycleId) return apiError("cycleId is required");

  const { rows, cycleName, goalSheets } = await buildAchievementReport({
    cycleId,
    departmentId,
    quarter: quarter === "ALL" ? null : quarter,
  });

  if (format === "json") {
    return NextResponse.json({
      success: true,
      data: {
        report: rows,
        generatedAt: new Date().toISOString(),
        cycle: { name: cycleName },
      },
    });
  }

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const filename = `achievement-report-${cycleId}-${new Date().toISOString().split("T")[0]}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(20).fill({ wch: 14 });
    XLSX.utils.book_append_sheet(wb, ws, "Achievement Report");

    const summaryData = [
      ["Report", "Achievement Report"],
      ["Cycle", cycleName],
      ["Generated At", new Date().toISOString()],
      ["Total Employees", new Set(goalSheets.map((s) => s.employeeId)).size],
      ["Total Goals", rows.length],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `achievement-report-${cycleId}-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return apiError("Invalid format. Use json, csv, or xlsx");
}
