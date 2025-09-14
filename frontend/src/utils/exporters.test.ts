import { describe, it, expect } from "vitest";
import {
  buildPdfDocDefinition,
  generatePdfBlob,
  generateExcelBlob,
  generateDocxBlob,
} from "./exporters";

const sample = [
  { risk_name: "A", probability: 3, impact: 4, score: 12, status: "open" },
  { risk_name: "B", probability: null, impact: 5, score: null, status: null },
  {
    risk_name: null,
    probability: 2,
    impact: null,
    score: null,
    status: "draft",
  },
];

describe("exporters", () => {
  it("buildPdfDocDefinition handles nulls safely", () => {
    const def = buildPdfDocDefinition(sample);
    expect(def.content).toBeTruthy();
    const body = (def as any).content[1].table.body;
    // Header + 3 rows
    expect(body.length).toBe(4);
    // Nulls mapped to placeholders
    expect(body[2]).toEqual(["B", "N/A", 5, "N/A", "unknown"]);
  });

  it("generatePdfBlob returns a Blob", async () => {
    const blob = await generatePdfBlob(sample);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it("generateExcelBlob returns an XLSX blob", () => {
    const blob = generateExcelBlob(sample);
    expect(blob).toBeInstanceOf(Blob);
    // Check MIME type hint
    expect(blob.type).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("generateDocxBlob returns a DOCX blob", async () => {
    const blob = await generateDocxBlob(sample);
    expect(blob).toBeInstanceOf(Blob);
    // No strict MIME available from docx library, just check non-empty
    expect(blob.size).toBeGreaterThan(0);
  });
});
