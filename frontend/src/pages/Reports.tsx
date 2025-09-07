import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { Risk } from "../types/risk";
import type { ActionItem } from "../types/actionItem";
import { api } from "../services/api";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";

// Set up PDFMake fonts
pdfMake.vfs = pdfFonts;

export default function Reports() {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "excel" | "word"
  >("pdf");
  const [selectedReportType, setSelectedReportType] = useState<
    "summary" | "risk-detail"
  >("summary");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: risks, isLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: () => api.get<Risk[]>("/risks").then((res) => res.data),
  });

  const { data: actionItems, isLoading: actionItemsLoading } = useQuery({
    queryKey: ["action-items"],
    queryFn: () =>
      api.get<ActionItem[]>("/action-items/").then((res) => res.data),
  });

  const filteredRisks =
    risks?.filter((risk) => {
      if (selectedCategory !== "all" && risk.category !== selectedCategory)
        return false;
      if (selectedStatus !== "all" && risk.status !== selectedStatus)
        return false;
      return true;
    }) || [];

  const generateExport = () => {
    if (!filteredRisks.length) return;

    if (selectedFormat === "excel") {
      generateExcel();
    } else if (selectedFormat === "word") {
      if (selectedReportType === "risk-detail") {
        generateWordDetail();
      } else {
        generateWordSummary();
      }
    } else if (selectedReportType === "risk-detail") {
      generateRiskDetailPDFKit();
    } else {
      generateSummaryPDF();
    }
  };

  const generateSummaryPDF = () => {
    // Prepare table data
    const tableBody = [
      // Header row
      [
        { text: "Title", style: "tableHeader" },
        { text: "Category", style: "tableHeader" },
        { text: "Risk Level", style: "tableHeader" },
        { text: "Status", style: "tableHeader" },
        { text: "Owner", style: "tableHeader" },
        { text: "Score", style: "tableHeader" },
      ],
      // Data rows
      ...filteredRisks.map((risk) => [
        { text: risk.risk_name, style: "tableCell" },
        { text: risk.category || "N/A", style: "tableCell" },
        {
          text: risk.risk_level,
          style: "tableCell",
          color:
            risk.risk_level === "High"
              ? "#dc2626"
              : risk.risk_level === "Medium"
              ? "#f59e0b"
              : "#22c55e",
        },
        {
          text: risk.status
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          style: "tableCell",
        },
        { text: risk.risk_owner || "Unassigned", style: "tableCell" },
        { text: risk.score.toString(), style: "tableCell" },
      ]),
    ];

    // Build filters text
    const filtersText = [];
    if (selectedCategory !== "all") {
      filtersText.push(`Category: ${selectedCategory}`);
    }
    if (selectedStatus !== "all") {
      filtersText.push(`Status: ${selectedStatus}`);
    }

    // PDFMake document definition
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: [
        // Header
        {
          text: "RiskWorks - Risk Summary Report",
          style: "header",
        },
        {
          text: `Generated on: ${new Date().toLocaleDateString()}`,
          style: "subheader",
        },
        {
          text: `Total Risks: ${filteredRisks.length}`,
          style: "subheader",
        },
        // Filters (if any)
        ...(filtersText.length > 0
          ? [
              { text: "Filters Applied:", style: "subheader" },
              ...filtersText.map((filter) => ({
                text: filter,
                style: "filterText",
              })),
            ]
          : []),
        // Spacing
        { text: "", margin: [0, 10, 0, 0] },
        // Table
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto", "auto", "auto"],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return "#3b82f6"; // Header row
              return rowIndex % 2 === 0 ? "#f8fafc" : null; // Alternating rows
            },
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: "#3b82f6",
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 10,
          color: "#64748b",
          margin: [0, 0, 0, 5],
        },
        filterText: {
          fontSize: 10,
          color: "#64748b",
          margin: [20, 0, 0, 5],
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: "white",
        },
        tableCell: {
          fontSize: 9,
          color: "#1e293b",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    // Generate and download PDF
    pdfMake
      .createPdf(docDefinition)
      .download(`risk-summary-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const generateExcel = () => {
    // Create comprehensive Excel export with all risk fields
    // This structure is designed to be compatible with future import functionality

    const excelData = filteredRisks.map((risk) => ({
      // Basic Information
      "Risk ID": risk.id,
      "Risk Name": risk.risk_name,
      Description: risk.risk_description || "",
      Category: risk.category || "",
      Status: risk.status,
      "Risk Owner": risk.risk_owner || "",
      "Owner ID": risk.owner_id,
      "Assigned To": risk.assigned_to || "",

      // Risk Assessment
      Probability: risk.probability,
      Impact: risk.impact,
      "Risk Score": risk.score,
      "Risk Level": risk.risk_level,

      // Risk Analysis
      "Probability Basis": risk.probability_basis || "",
      "Impact Basis": risk.impact_basis || "",
      Notes: risk.notes || "",

      // Dates
      "Created At": risk.created_at
        ? new Date(risk.created_at).toISOString()
        : "",
      "Updated At": risk.updated_at
        ? new Date(risk.updated_at).toISOString()
        : "",
      "Latest Reviewed Date": risk.latest_reviewed_date
        ? new Date(risk.latest_reviewed_date).toISOString()
        : "",

      // Additional fields for future compatibility
      Priority: "", // For future use
      "Mitigation Strategy": "", // For future use
      "Contingency Plan": "", // For future use
      "Review Frequency": "", // For future use
      "Next Review Date": "", // For future use
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 8 }, // Risk ID
      { wch: 25 }, // Risk Name
      { wch: 40 }, // Description
      { wch: 15 }, // Category
      { wch: 12 }, // Status
      { wch: 20 }, // Risk Owner
      { wch: 10 }, // Owner ID
      { wch: 10 }, // Assigned To
      { wch: 12 }, // Probability
      { wch: 8 }, // Impact
      { wch: 10 }, // Risk Score
      { wch: 12 }, // Risk Level
      { wch: 40 }, // Probability Basis
      { wch: 40 }, // Impact Basis
      { wch: 40 }, // Notes
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Latest Reviewed Date
      { wch: 12 }, // Priority
      { wch: 40 }, // Mitigation Strategy
      { wch: 40 }, // Contingency Plan
      { wch: 15 }, // Review Frequency
      { wch: 20 }, // Next Review Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Risks");

    // Create Action Items worksheet
    if (actionItems && actionItems.length > 0) {
      const actionItemsData = actionItems.map((actionItem) => ({
        // Basic Information
        "Action Item ID": actionItem.id,
        Title: actionItem.title,
        Description: actionItem.description || "",
        "Action Type": actionItem.action_type,
        Priority: actionItem.priority,
        Status: actionItem.status,

        // Assignment
        "Assigned To": actionItem.assigned_to || "",
        "Created By": actionItem.created_by,
        "Risk ID": actionItem.risk_id,

        // Dates
        "Due Date": actionItem.due_date
          ? new Date(actionItem.due_date).toISOString()
          : "",
        "Completed Date": actionItem.completed_date
          ? new Date(actionItem.completed_date).toISOString()
          : "",
        "Created At": actionItem.created_at
          ? new Date(actionItem.created_at).toISOString()
          : "",
        "Updated At": actionItem.updated_at
          ? new Date(actionItem.updated_at).toISOString()
          : "",

        // Progress
        "Progress Percentage": actionItem.progress_percentage,

        // Additional fields for future compatibility
        "Estimated Hours": "", // For future use
        "Actual Hours": "", // For future use
        Cost: "", // For future use
        "Resources Required": "", // For future use
        Dependencies: "", // For future use
      }));

      const actionItemsWorksheet = XLSX.utils.json_to_sheet(actionItemsData);

      // Set column widths for action items
      const actionItemsColumnWidths = [
        { wch: 12 }, // Action Item ID
        { wch: 30 }, // Title
        { wch: 40 }, // Description
        { wch: 15 }, // Action Type
        { wch: 10 }, // Priority
        { wch: 12 }, // Status
        { wch: 12 }, // Assigned To
        { wch: 10 }, // Created By
        { wch: 8 }, // Risk ID
        { wch: 20 }, // Due Date
        { wch: 20 }, // Completed Date
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
        { wch: 15 }, // Progress Percentage
        { wch: 12 }, // Estimated Hours
        { wch: 12 }, // Actual Hours
        { wch: 10 }, // Cost
        { wch: 20 }, // Resources Required
        { wch: 20 }, // Dependencies
      ];
      actionItemsWorksheet["!cols"] = actionItemsColumnWidths;

      XLSX.utils.book_append_sheet(
        workbook,
        actionItemsWorksheet,
        "Action Items"
      );
    }

    // Create a metadata sheet with export information
    const metadata = [
      { Field: "Export Date", Value: new Date().toISOString() },
      { Field: "Total Risks", Value: filteredRisks.length },
      { Field: "Total Action Items", Value: actionItems?.length || 0 },
      {
        Field: "Filters Applied",
        Value:
          selectedCategory !== "all" || selectedStatus !== "all" ? "Yes" : "No",
      },
      { Field: "Category Filter", Value: selectedCategory },
      { Field: "Status Filter", Value: selectedStatus },
      { Field: "Export Format", Value: "Excel" },
      { Field: "Version", Value: "1.0" },
      { Field: "Compatible with Import", Value: "Yes" },
      {
        Field: "Includes Action Items",
        Value: actionItems && actionItems.length > 0 ? "Yes" : "No",
      },
    ];

    const metadataSheet = XLSX.utils.json_to_sheet(metadata);
    metadataSheet["!cols"] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Export Info");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `risk-export-${timestamp}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, filename);
  };

  const generateWordSummary = async () => {
    // Build filters text
    const filtersText = [];
    if (selectedCategory !== "all") {
      filtersText.push(`Category: ${selectedCategory}`);
    }
    if (selectedStatus !== "all") {
      filtersText.push(`Status: ${selectedStatus}`);
    }

    // Create table rows
    const tableRows = [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Title", bold: true })],
              }),
            ],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Category", bold: true })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Risk Level", bold: true })],
              }),
            ],
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Status", bold: true })],
              }),
            ],
            width: { size: 12, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Owner", bold: true })],
              }),
            ],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Score", bold: true })],
              }),
            ],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      // Data rows
      ...filteredRisks.map(
        (risk) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: risk.risk_name })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: risk.category || "N/A" })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: risk.risk_level,
                        color:
                          risk.risk_level === "High"
                            ? "DC2626"
                            : risk.risk_level === "Medium"
                            ? "F59E0B"
                            : "22C55E",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: risk.status
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: risk.risk_owner || "Unassigned" }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: risk.score.toString() })],
                  }),
                ],
              }),
            ],
          })
      ),
    ];

    // Create document sections
    const sections = [
      // Header
      new Paragraph({
        children: [
          new TextRun({
            text: "RiskWorks - Risk Summary Report",
            bold: true,
            size: 32,
            color: "3B82F6",
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
      // Generation date
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            size: 20,
            color: "64748B",
          }),
        ],
        spacing: { after: 100 },
      }),
      // Total risks
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Risks: ${filteredRisks.length}`,
            size: 20,
            color: "64748B",
          }),
        ],
        spacing: { after: 200 },
      }),
    ];

    // Add filters if any
    if (filtersText.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Filters Applied:",
              bold: true,
              size: 20,
              color: "64748B",
            }),
          ],
          spacing: { after: 100 },
        })
      );
      filtersText.forEach((filter) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: filter,
                size: 20,
                color: "64748B",
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 50 },
          })
        );
      });
      sections.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    // Add table
    sections.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    // Create document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Roboto",
            },
            paragraph: {
              font: "Roboto",
            },
          },
        },
      },
      sections: [
        {
          children: sections,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `risk-summary-${
      new Date().toISOString().split("T")[0]
    }.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateWordDetail = async () => {
    // Create sections for each risk
    const riskSections = filteredRisks.map((risk, index) => {
      const riskScore = risk.probability * risk.impact;

      return [
        // Page break for each risk
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 })],
          pageBreakBefore: true,
        }),

        // Title Section (90% / 10% split)
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Title",
                          bold: true,
                          color: "3B82F6",
                          size: 20,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: risk.risk_name,
                          bold: true,
                          size: 24,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 90, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `ID: ${risk.id}`,
                          size: 16,
                          color: "64748B",
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: risk.status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                          size: 16,
                          color: "64748B",
                          bold: true,
                        }),
                      ],
                      alignment: AlignmentType.RIGHT,
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Description
        new Paragraph({
          children: [
            new TextRun({
              text: "Description",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: risk.risk_description || "No description provided",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        }),

        // Two Column Layout for Basic Information and Risk Assessment
        new Table({
          rows: [
            new TableRow({
              children: [
                // Left Column - Basic Information
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Basic Information",
                          bold: true,
                          color: "1E293B",
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Owner:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${risk.risk_owner || "Not specified"}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Latest Reviewed:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${
                            risk.latest_reviewed_date
                              ? new Date(
                                  risk.latest_reviewed_date
                                ).toLocaleDateString()
                              : "Never reviewed"
                          }`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Category:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${risk.category || "Not specified"}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Created By (Owner ID):",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` User ID: ${risk.owner_id}`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Assigned To:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${
                            risk.assigned_to
                              ? `User ID: ${risk.assigned_to}`
                              : "Not assigned"
                          }`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
                // Right Column - Risk Assessment
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Assessment",
                          bold: true,
                          color: "1E293B",
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Probability:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${risk.probability}/5`,
                          size: 18,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Impact:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({ text: ` ${risk.impact}/5`, size: 18 }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Score:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${riskScore}`,
                          bold: true,
                          size: 22,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Risk Level:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({ text: ` ${risk.risk_level}`, size: 18 }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Full Width Sections
        new Paragraph({
          children: [
            new TextRun({
              text: "Probability Basis",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text:
                risk.probability_basis ||
                "No probability justification provided",
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Impact Basis",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: risk.impact_basis || "No impact justification provided",
              size: 18,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "Notes",
              bold: true,
              color: "3B82F6",
              size: 18,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: risk.notes || "No notes provided", size: 18 }),
          ],
          spacing: { after: 200 },
        }),

        // Audit Information
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Created At:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${new Date(
                            risk.created_at
                          ).toLocaleString()}`,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Last Updated:",
                          bold: true,
                          color: "64748B",
                          size: 18,
                        }),
                        new TextRun({
                          text: ` ${new Date(
                            risk.updated_at
                          ).toLocaleString()}`,
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                  width: { size: 48, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on: ${new Date().toLocaleDateString()}`,
              size: 14,
              color: "64748B",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ];
    });

    // Flatten all sections
    const allSections = riskSections.flat();

    // Create document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Roboto",
            },
            paragraph: {
              font: "Roboto",
            },
          },
        },
      },
      sections: [
        {
          children: allSections,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `risk-detail-report-${
      new Date().toISOString().split("T")[0]
    }.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Removed generateDetailedPDF function - no longer used

  const generateRiskDetailPDF = () => {
    // Create content for each risk with comprehensive field layout
    const riskPages = filteredRisks.flatMap((risk, index) => {
      const riskLevelColor =
        risk.risk_level === "High"
          ? "#dc2626"
          : risk.risk_level === "Medium"
          ? "#f59e0b"
          : "#22c55e";
      const riskScore = risk.probability * risk.impact;

      return {
        stack: [
          // Header
          {
            stack: [
              { text: "RiskWorks", style: "companyHeader" },
              { text: "Risk Detail Report", style: "formHeader" },
            ],
            margin: [0, 0, 0, 20],
          },

          // Title Section with Risk ID and Status
          {
            columns: [
              {
                stack: [
                  { text: "Title", style: "sectionHeader" },
                  { text: risk.risk_name, style: "riskTitle" },
                ],
                width: "90%",
              },
              {
                stack: [
                  { text: `ID: ${risk.id}`, style: "riskId" },
                  {
                    text: risk.status
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    style: "statusBadge",
                  },
                ],
                width: "10%",
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 20],
          },
          {
            text: "Description",
            style: "sectionHeader",
          },
          {
            text: risk.risk_description || "No description provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Risk Level Badge
          {
            text: risk.risk_level,
            style: "riskLevelBadge",
            color: "white",
            fillColor: riskLevelColor,
            margin: [0, 0, 0, 20],
          },

          // Two Column Layout for Main Information
          {
            columns: [
              // Left Column - Basic Information
              {
                stack: [
                  { text: "Basic Information", style: "subsectionHeader" },
                  { text: "", margin: [0, 5, 0, 0] }, // Spacing

                  { text: "Risk Owner:", style: "fieldLabel" },
                  {
                    text: risk.risk_owner || "Not specified",
                    style: "fieldValue",
                  },

                  { text: "Latest Reviewed:", style: "fieldLabel" },
                  {
                    text: risk.latest_reviewed_date
                      ? new Date(risk.latest_reviewed_date).toLocaleDateString()
                      : "Never reviewed",
                    style: "fieldValue",
                  },

                  { text: "Category:", style: "fieldLabel" },
                  {
                    text: risk.category || "Not specified",
                    style: "fieldValue",
                  },

                  { text: "Created By (Owner ID):", style: "fieldLabel" },
                  { text: `User ID: ${risk.owner_id}`, style: "fieldValue" },

                  { text: "Assigned To:", style: "fieldLabel" },
                  {
                    text: risk.assigned_to
                      ? `User ID: ${risk.assigned_to}`
                      : "Not assigned",
                    style: "fieldValue",
                  },
                ],
                width: "*",
              },
              // Right Column - Risk Assessment
              {
                stack: [
                  { text: "Risk Assessment", style: "subsectionHeader" },
                  { text: "", margin: [0, 5, 0, 0] }, // Spacing

                  { text: "Probability:", style: "fieldLabel" },
                  { text: `${risk.probability}/5`, style: "fieldValue" },

                  { text: "Impact:", style: "fieldLabel" },
                  { text: `${risk.impact}/5`, style: "fieldValue" },

                  { text: "Risk Score:", style: "fieldLabel" },
                  { text: riskScore.toString(), style: "riskScore" },

                  { text: "Risk Level:", style: "fieldLabel" },
                  { text: risk.risk_level, style: "fieldValue" },
                ],
                width: "*",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Probability Basis (Full Width)
          { text: "Probability Basis", style: "sectionHeader" },
          {
            text:
              risk.probability_basis || "No probability justification provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Impact Basis (Full Width)
          { text: "Impact Basis", style: "sectionHeader" },
          {
            text: risk.impact_basis || "No impact justification provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Notes (Full Width)
          { text: "Notes", style: "sectionHeader" },
          {
            text: risk.notes || "No notes provided",
            style: "description",
            margin: [0, 0, 0, 20],
          },

          // Audit Information (Two Column)
          {
            columns: [
              {
                stack: [
                  { text: "Created At:", style: "fieldLabel" },
                  {
                    text: new Date(risk.created_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
                width: "*",
              },
              {
                stack: [
                  { text: "Last Updated:", style: "fieldLabel" },
                  {
                    text: new Date(risk.updated_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
                width: "*",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Footer
          {
            text: `Generated on: ${new Date().toLocaleDateString()} | Risk ID: ${
              risk.id
            }`,
            style: "footer",
            margin: [0, 20, 0, 0],
          },
        ],
      };
    });

    // PDFMake document definition
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: riskPages,
      styles: {
        companyHeader: {
          fontSize: 18,
          bold: true,
          color: "white",
        },
        formHeader: {
          fontSize: 12,
          color: "white",
        },
        riskId: {
          fontSize: 10,
          color: "#64748b",
          margin: [0, 0, 0, 5],
        },
        statusBadge: {
          fontSize: 10,
          bold: true,
          color: "#3b82f6",
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: "#3b82f6",
          margin: [0, 10, 0, 5],
        },
        subsectionHeader: {
          fontSize: 11,
          bold: true,
          color: "#1e293b",
          margin: [0, 10, 0, 5],
        },
        riskTitle: {
          fontSize: 16,
          bold: true,
          color: "#1e293b",
        },
        riskLevelBadge: {
          fontSize: 14,
          bold: true,
          alignment: "center",
          margin: [10, 5, 10, 5],
        },
        fieldLabel: {
          fontSize: 9,
          color: "#64748b",
          margin: [0, 5, 0, 2],
        },
        fieldValue: {
          fontSize: 10,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        riskScore: {
          fontSize: 14,
          bold: true,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        description: {
          fontSize: 10,
          color: "#1e293b",
          lineHeight: 1.4,
        },
        footer: {
          fontSize: 10,
          color: "#64748b",
          alignment: "center",
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
      pageSize: "A4",
      pageMargins: [40, 10, 40, 20],
    };

    // Generate and download PDF
    pdfMake
      .createPdf(docDefinition)
      .download(
        `risk-detail-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
  };

  const generateRiskDetailPDFKit = () => {
    // Create individual pages for each risk with consistent margins
    const riskPages = filteredRisks.map((risk, index) => {
      const riskScore = risk.probability * risk.impact;
      const riskLevelColor =
        risk.risk_level === "High"
          ? "#dc2626"
          : risk.risk_level === "Medium"
          ? "#f59e0b"
          : "#22c55e";

      return {
        // Force page break for each risk except the first
        pageBreak: index > 0 ? "before" : undefined,
        stack: [
          // Title Section (90% / 10% split)
          {
            columns: [
              {
                width: "90%",
                stack: [
                  { text: "Title", style: "fieldLabel" },
                  { text: risk.risk_name, style: "titleText" },
                ],
              },
              {
                width: "10%",
                stack: [
                  { text: `ID: ${risk.id}`, style: "infoText" },
                  {
                    text: risk.status
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    style: "statusText",
                  },
                ],
                alignment: "right",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Description
          {
            stack: [
              { text: "Description", style: "fieldLabel" },
              {
                text: risk.risk_description || "No description provided",
                style: "fieldValue",
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Two Column Layout
          {
            columns: [
              // Left Column - Basic Information
              {
                width: "48%",
                stack: [
                  { text: "Basic Information", style: "sectionHeader" },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [
                          {
                            stack: [
                              { text: "Risk Owner:", style: "fieldLabel" },
                              {
                                text: risk.risk_owner || "Not specified",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Latest Reviewed:", style: "fieldLabel" },
                              {
                                text: risk.latest_reviewed_date
                                  ? new Date(
                                      risk.latest_reviewed_date
                                    ).toLocaleDateString()
                                  : "Never reviewed",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Category:", style: "fieldLabel" },
                              {
                                text: risk.category || "Not specified",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              {
                                text: "Created By (Owner ID):",
                                style: "fieldLabel",
                              },
                              {
                                text: `User ID: ${risk.owner_id}`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Assigned To:", style: "fieldLabel" },
                              {
                                text: risk.assigned_to
                                  ? `User ID: ${risk.assigned_to}`
                                  : "Not assigned",
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
              },
              // Right Column - Risk Assessment
              {
                width: "48%",
                stack: [
                  { text: "Risk Assessment", style: "sectionHeader" },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [
                          {
                            stack: [
                              { text: "Probability:", style: "fieldLabel" },
                              {
                                text: `${risk.probability}/5`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Impact:", style: "fieldLabel" },
                              {
                                text: `${risk.impact}/5`,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Risk Score:", style: "fieldLabel" },
                              {
                                text: riskScore.toString(),
                                style: "riskScoreText",
                              },
                            ],
                          },
                        ],
                        [
                          {
                            stack: [
                              { text: "Risk Level:", style: "fieldLabel" },
                              {
                                text: risk.risk_level,
                                style: "fieldValue",
                              },
                            ],
                          },
                        ],
                      ],
                    },
                    layout: "noBorders",
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Full Width Sections
          {
            stack: [
              {
                stack: [
                  { text: "Probability Basis", style: "fieldLabel" },
                  {
                    text:
                      risk.probability_basis ||
                      "No probability justification provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
              {
                stack: [
                  { text: "Impact Basis", style: "fieldLabel" },
                  {
                    text:
                      risk.impact_basis || "No impact justification provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
              {
                stack: [
                  { text: "Notes", style: "fieldLabel" },
                  {
                    text: risk.notes || "No notes provided",
                    style: "fieldValue",
                  },
                ],
                margin: [0, 0, 0, 15],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Audit Information
          {
            columns: [
              {
                width: "48%",
                stack: [
                  { text: "Created At:", style: "fieldLabel" },
                  {
                    text: new Date(risk.created_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
              },
              {
                width: "48%",
                stack: [
                  { text: "Last Updated:", style: "fieldLabel" },
                  {
                    text: new Date(risk.updated_at).toLocaleString(),
                    style: "fieldValue",
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 20],
          },

          // Footer - Push to bottom of page
          {
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            style: "footer",
            margin: [0, 0, 0, 0],
            absolutePosition: { x: 40, y: 750 }, // Position at bottom of US Letter page
          },
        ],
      };
    });

    // PDFMake document definition with consistent margins
    const docDefinition = {
      fonts: {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      },
      content: riskPages,
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
      },
      styles: {
        companyHeader: {
          fontSize: 18,
          color: "#3b82f6",
          bold: true,
        },
        formHeader: {
          fontSize: 12,
          color: "#3b82f6",
          margin: [0, 5, 0, 0],
        },
        fieldLabel: {
          fontSize: 12,
          color: "#3b82f6",
          bold: true,
          margin: [0, 0, 0, 5],
        },
        titleText: {
          fontSize: 16,
          color: "#1e293b",
          bold: true,
        },
        infoText: {
          fontSize: 10,
          color: "#64748b",
        },
        statusText: {
          fontSize: 10,
          color: "#3b82f6",
          bold: true,
        },
        sectionHeader: {
          fontSize: 11,
          color: "#1e293b",
          bold: true,
          margin: [0, 0, 0, 10],
        },
        fieldValue: {
          fontSize: 10,
          color: "#1e293b",
          margin: [0, 0, 0, 8],
        },
        riskScoreText: {
          fontSize: 14,
          color: "#1e293b",
          bold: true,
          margin: [0, 0, 0, 8],
        },
        footer: {
          fontSize: 10,
          color: "#64748b",
          alignment: "center",
        },
      },
      pageMargins: [40, 20, 40, 20], // Consistent margins for all pages
      pageSize: "LETTER",
    };

    pdfMake
      .createPdf(docDefinition)
      .download(
        `risk-detail-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "mitigated":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case "escalated":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading || actionItemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Filters Section */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) =>
                    setSelectedReportType(
                      e.target.value as "summary" | "risk-detail"
                    )
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="summary">Summary Table</option>
                  <option value="risk-detail">
                    Risk Detail Report (All Fields)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="strategic">Strategic</option>
                  <option value="technical">Technical</option>
                  <option value="compliance">Compliance</option>
                  <option value="security">Security</option>
                  <option value="environmental">Environmental</option>
                  <option value="reputational">Reputational</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Export Format
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) =>
                    setSelectedFormat(
                      e.target.value as "pdf" | "excel" | "word"
                    )
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 lg:ml-4">
            <button
              onClick={generateExport}
              disabled={!filteredRisks.length}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Preview ({filteredRisks.length} risks)
          </h3>
          <div className="text-sm text-secondary-600">
            Showing filtered results
          </div>
        </div>

        {filteredRisks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">
              No risks match the selected filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Risk Level
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Owner
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-secondary-100 hover:bg-secondary-50"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-secondary-900">
                        {risk.risk_name}
                      </div>
                      {risk.risk_description && (
                        <div className="text-sm text-secondary-600 truncate max-w-xs">
                          {risk.risk_description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                        {risk.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(
                          risk.risk_level
                        )}`}
                      >
                        {risk.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(risk.status)}
                        <span className="text-sm text-secondary-700">
                          {risk.status
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-700">
                      {risk.risk_owner || "Unassigned"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium text-secondary-900">
                        {risk.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
