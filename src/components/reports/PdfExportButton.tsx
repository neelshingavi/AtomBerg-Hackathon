"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function PdfExportButton({
  cycleId,
  type = "executive-summary",
  label = "PDF Report",
}: {
  cycleId: string;
  type?: "executive-summary" | "escalation";
  label?: string;
}) {
  function download() {
    const qs = new URLSearchParams({ cycleId, type });
    window.open(`/api/reports/pdf?${qs}`, "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={download}>
      <FileText className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
