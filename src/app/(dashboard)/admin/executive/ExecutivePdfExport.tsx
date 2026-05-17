"use client";

import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { PdfExportButton } from "@/components/reports/PdfExportButton";

export function ExecutivePdfExport() {
  const { data } = useCurrentCycle();
  const cycleId = data?.active?.id;
  if (!cycleId) return null;
  return <PdfExportButton cycleId={cycleId} label="Board Report (PDF)" />;
}
