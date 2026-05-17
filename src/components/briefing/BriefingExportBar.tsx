"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfExportButton } from "@/components/reports/PdfExportButton";

export function BriefingExportBar({ cycleId }: { cycleId: string }) {
  return (
    <div className="flex gap-2">
      <PdfExportButton cycleId={cycleId} label="Board Pack (PDF)" />
      <Button
        variant="outline"
        size="sm"
        className="border-white/20 text-white"
        onClick={() => window.print()}
      >
        <FileDown className="mr-1.5 h-4 w-4" />
        Snapshot
      </Button>
    </div>
  );
}
