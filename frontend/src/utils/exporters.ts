import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, TextRun } from "docx";

// Attach embedded fonts for pdfmake in browser/jsdom
// vfs_fonts exports an object with pdfMake.vfs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pdfMake.vfs =
  (pdfFonts as any).pdfMake?.vfs ??
  (pdfFonts as unknown as Record<string, unknown>);

export type RiskRow = {
  risk_name?: string | null;
  probability?: number | null;
  impact?: number | null;
  score?: number | null;
  status?: string | null;
};

export function buildPdfDocDefinition(rows: RiskRow[]) {
  const safe = (v: unknown, fallback = "N/A") =>
    v === undefined || v === null || v === "" ? fallback : v;
  const body = [
    ["Name", "Probability", "Impact", "Score", "Status"],
    ...rows.map((r) => [
      safe(r.risk_name),
      safe(r.probability, "N/A"),
      safe(r.impact, "N/A"),
      safe(r.score, "N/A"),
      safe(r.status, "unknown"),
    ]),
  ];
  return {
    content: [
      { text: "Risk Summary", style: "header" },
      { table: { headerRows: 1, body } },
    ],
    styles: { header: { fontSize: 16, bold: true } },
  } as const;
}

export async function generatePdfBlob(rows: RiskRow[]): Promise<Blob> {
  const def = buildPdfDocDefinition(rows);
  return new Promise((resolve, reject) => {
    const pdf = pdfMake.createPdf(def as any);
    pdf.getBlob((blob: Blob) => resolve(blob));
  });
}

export function generateExcelBlob(rows: RiskRow[]): Blob {
  const safeRows = rows.map((r) => ({
    Name: r.risk_name ?? "N/A",
    Probability: r.probability ?? "N/A",
    Impact: r.impact ?? "N/A",
    Score: r.score ?? "N/A",
    Status: r.status ?? "unknown",
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(safeRows);
  XLSX.utils.book_append_sheet(wb, ws, "Risks");
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function generateDocxBlob(rows: RiskRow[]): Promise<Blob> {
  const paras = rows.map(
    (r) =>
      new Paragraph({
        children: [
          new TextRun(
            `${r.risk_name ?? "N/A"} - P:${r.probability ?? "N/A"} I:${
              r.impact ?? "N/A"
            } S:${r.score ?? "N/A"} (${r.status ?? "unknown"})`
          ),
        ],
      })
  );
  const doc = new Document({
    sections: [{ children: [new Paragraph("Risk Summary"), ...paras] }],
  });
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
