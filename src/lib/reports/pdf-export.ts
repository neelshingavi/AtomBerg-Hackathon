import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfReportType =
  | "executive-summary"
  | "quarterly-review"
  | "completion"
  | "escalation"
  | "audit";

export type PdfSection = {
  title: string;
  rows: Array<Record<string, string | number>>;
};

export function generatePdfReport(params: {
  title: string;
  subtitle?: string;
  type: PdfReportType;
  sections: PdfSection[];
  kpis?: Array<{ label: string; value: string | number }>;
}): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal";
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(appName, 14, 14);
  doc.setFontSize(10);
  doc.text("Organizational Performance Operating System", 14, 21);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 27);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.text(params.title, 14, 44);
  if (params.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(params.subtitle, 14, 51);
  }

  let y = 58;

  if (params.kpis?.length) {
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Key Performance Indicators", 14, y);
    y += 6;
    const kpiData = params.kpis.map((k) => [k.label, String(k.value)]);
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: kpiData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  for (const section of params.sections) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 95);
    doc.text(section.title, 14, y);
    y += 4;

    if (section.rows.length) {
      const headers = Object.keys(section.rows[0]);
      const body = section.rows.map((r) => headers.map((h) => String(r[h] ?? "—")));
      autoTable(doc, {
        startY: y,
        head: [headers],
        body,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${appName} · Confidential · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
