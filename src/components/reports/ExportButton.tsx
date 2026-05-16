"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton({
  cycleId,
  departmentId,
  quarter,
  format,
  label,
}: {
  cycleId: string;
  departmentId?: string;
  quarter?: string;
  format: "csv" | "xlsx";
  label?: string;
}) {
  function download() {
    const qs = new URLSearchParams({ cycleId, format });
    if (departmentId) qs.set("departmentId", departmentId);
    if (quarter) qs.set("quarter", quarter);
    window.open(`/api/reports/achievement?${qs}`, "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <Download className="h-4 w-4 mr-2" />
      {label ?? format.toUpperCase()}
    </Button>
  );
}
