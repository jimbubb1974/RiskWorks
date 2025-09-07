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
import { api } from "../services/api";
import jsPDF from "jspdf";

export default function Reports() {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "excel" | "word"
  >("pdf");
  const [selectedReportType, setSelectedReportType] = useState<
    "summary" | "detailed"
  >("summary");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: risks, isLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: () => api.get<Risk[]>("/risks").then((res) => res.data),
  });

  const filteredRisks =
    risks?.filter((risk) => {
      if (selectedCategory !== "all" && risk.category !== selectedCategory)
        return false;
      if (selectedStatus !== "all" && risk.status !== selectedStatus)
        return false;
      return true;
    }) || [];

  const generatePDF = () => {
    if (!filteredRisks.length) return;

    if (selectedReportType === "detailed") {
      generateDetailedPDF();
    } else {
      generateSummaryPDF();
    }
  };

  const generateSummaryPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text("RiskWorks - Risk Summary Report", 20, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 25);
    doc.text(`Total Risks: ${filteredRisks.length}`, 20, 32);

    // Filters applied
    let tableStartY = 40;
    if (selectedCategory !== "all" || selectedStatus !== "all") {
      doc.text("Filters Applied:", 20, 40);
      let yPos = 47;
      if (selectedCategory !== "all") {
        doc.text(`Category: ${selectedCategory}`, 30, yPos);
        yPos += 8;
      }
      if (selectedStatus !== "all") {
        doc.text(`Status: ${selectedStatus}`, 30, yPos);
        yPos += 8;
      }
      tableStartY = yPos + 5;
    }

    // Risk table
    let yPos = tableStartY;
    const startX = 20;
    const tableWidth = 160; // Adjusted: 30+30+20+20+30+30=160
    const colWidths = [30, 30, 20, 20, 30, 30]; // Test: Reduced title column from 50 to 30 to force wrapping

    // Table headers
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    doc.rect(startX, yPos - 5, tableWidth, 8, "F");

    doc.text("Title", startX + 2, yPos);
    doc.text("Category", startX + colWidths[0] + 2, yPos);
    doc.text("Risk Level", startX + colWidths[0] + colWidths[1] + 2, yPos);
    doc.text(
      "Status",
      startX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
      yPos
    );
    doc.text(
      "Owner",
      startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2,
      yPos
    );
    doc.text(
      "Score",
      startX +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4] +
        2,
      yPos
    );

    yPos += 15;

    // Risk rows
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    filteredRisks.forEach((risk, index) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 15; // Reduced from 20 to match new header position
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, yPos - 3, tableWidth, 16, "F"); // Increased height from 8 to 16 for two lines
      }

      // Risk level color coding
      let riskColor = [0, 0, 0];
      if (risk.risk_level === "High") riskColor = [220, 38, 38]; // Red
      else if (risk.risk_level === "Medium")
        riskColor = [245, 158, 11]; // Yellow
      else if (risk.risk_level === "Low") riskColor = [34, 197, 94]; // Green

      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(risk.risk_level, startX + colWidths[0] + colWidths[1] + 2, yPos);

      // Reset color for other text
      doc.setTextColor(0, 0, 0);

      // Handle text with two-line support
      const title = risk.risk_name;
      const category = risk.category || "N/A";
      const status = risk.status
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const owner = risk.risk_owner || "Unassigned";

      // Function to split text into two lines using actual text width measurement
      const splitText = (text: string, maxWidthPixels: number) => {
        if (doc.getTextWidth(text) <= maxWidthPixels) return [text];

        const words = text.split(" ");
        const lines = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          if (doc.getTextWidth(testLine) <= maxWidthPixels) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Single word is too long, truncate it
              let truncated = word;
              while (
                doc.getTextWidth(truncated + "...") > maxWidthPixels &&
                truncated.length > 0
              ) {
                truncated = truncated.substring(0, truncated.length - 1);
              }
              lines.push(truncated + "...");
              currentLine = "";
            }
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines.slice(0, 2); // Limit to 2 lines
      };

      // Title (first column) - allow two lines (30px column width minus 4px padding)
      const titleLines = splitText(title, 26);
      doc.text(titleLines[0], startX + 2, yPos);
      if (titleLines[1]) {
        doc.text(titleLines[1], startX + 2, yPos + 6);
      }

      // Category (second column)
      doc.text(category, startX + colWidths[0] + 2, yPos);

      // Risk Level (third column)
      doc.text(risk.risk_level, startX + colWidths[0] + colWidths[1] + 2, yPos);

      // Status (fourth column)
      doc.text(
        status,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
        yPos
      );

      // Owner (fifth column) - allow two lines (30px column width minus 4px padding)
      const ownerLines = splitText(owner, 26);
      doc.text(
        ownerLines[0],
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2,
        yPos
      );
      if (ownerLines[1]) {
        doc.text(
          ownerLines[1],
          startX +
            colWidths[0] +
            colWidths[1] +
            colWidths[2] +
            colWidths[3] +
            2,
          yPos + 6
        );
      }

      // Score (sixth column)
      doc.text(
        risk.score.toString(),
        startX +
          colWidths[0] +
          colWidths[1] +
          colWidths[2] +
          colWidths[3] +
          colWidths[4] +
          2,
        yPos
      );

      yPos += 16; // Increased from 10 to 16 to accommodate two-line rows
    });

    // Save the PDF
    doc.save(`risk-summary-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const generateDetailedPDF = () => {
    const doc = new jsPDF();

    filteredRisks.forEach((risk, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Header with company branding
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 30, "F");

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("RiskWorks", 20, 20);

      doc.setFontSize(12);
      doc.text("Risk Assessment Form", 20, 30);

      // Risk level indicator (right side of header)
      const riskLevelColor =
        risk.risk_level === "High"
          ? [220, 38, 38]
          : risk.risk_level === "Medium"
          ? [245, 158, 11]
          : [34, 197, 94];

      doc.setFillColor(riskLevelColor[0], riskLevelColor[1], riskLevelColor[2]);
      doc.rect(150, 10, 50, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(risk.risk_level, 175, 20);

      // Main content area
      let yPos = 50;

      // Title section
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      doc.text("Risk Title", 20, yPos);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.risk_name, 20, yPos + 10);

      yPos += 25;

      // Basic Information Grid
      const leftCol = 20;
      const rightCol = 120;

      // Left column
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Category:", leftCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.category || "Not specified", leftCol + 30, yPos);

      yPos += 15;
      doc.setTextColor(100, 100, 100);
      doc.text("Status:", leftCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(
        risk.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        leftCol + 30,
        yPos
      );

      yPos += 15;
      doc.setTextColor(100, 100, 100);
      doc.text("Owner:", leftCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.risk_owner || "Unassigned", leftCol + 30, yPos);

      yPos += 15;
      doc.setTextColor(100, 100, 100);
      doc.text("Department:", leftCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.category || "Not specified", leftCol + 30, yPos);

      // Right column
      yPos = 75;
      doc.setTextColor(100, 100, 100);
      doc.text("Risk Score:", rightCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text(risk.score.toString(), rightCol + 35, yPos);

      yPos += 15;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Likelihood:", rightCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.probability.toString(), rightCol + 35, yPos);

      yPos += 15;
      doc.setTextColor(100, 100, 100);
      doc.text("Impact:", rightCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.impact.toString(), rightCol + 35, yPos);

      yPos += 15;
      doc.setTextColor(100, 100, 100);
      doc.text("Location:", rightCol, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(risk.risk_owner || "Not specified", rightCol + 35, yPos);

      // Description section
      yPos = 140;
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Description:", 20, yPos);
      doc.setTextColor(0, 0, 0);

      // Handle long descriptions with word wrapping
      const description = risk.risk_description || "No description provided";
      const maxWidth = 170;
      const words = description.split(" ");
      let line = "";
      let lineY = yPos + 10;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        if (doc.getTextWidth(testLine) > maxWidth && line !== "") {
          doc.text(line, 20, lineY);
          line = words[i] + " ";
          lineY += 7;
        } else {
          line = testLine;
        }
      }
      doc.text(line, 20, lineY);

      // Root Cause section
      yPos = Math.max(180, lineY + 15);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Root Cause:", 20, yPos);
      doc.setTextColor(0, 0, 0);

      const rootCause = risk.probability_basis || "Not specified";
      const rootCauseWords = rootCause.split(" ");
      line = "";
      lineY = yPos + 10;

      for (let i = 0; i < rootCauseWords.length; i++) {
        const testLine = line + rootCauseWords[i] + " ";
        if (doc.getTextWidth(testLine) > maxWidth && line !== "") {
          doc.text(line, 20, lineY);
          line = rootCauseWords[i] + " ";
          lineY += 7;
        } else {
          line = testLine;
        }
      }
      doc.text(line, 20, lineY);

      // Mitigation Strategy section
      yPos = Math.max(220, lineY + 15);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Mitigation Strategy:", 20, yPos);
      doc.setTextColor(0, 0, 0);

      const mitigation = risk.impact_basis || "Not specified";
      const mitigationWords = mitigation.split(" ");
      line = "";
      lineY = yPos + 10;

      for (let i = 0; i < rootCauseWords.length; i++) {
        const testLine = line + mitigationWords[i] + " ";
        if (line !== "" && doc.getTextWidth(testLine) > maxWidth) {
          doc.text(line, 20, lineY);
          line = mitigationWords[i] + " ";
          lineY += 7;
        } else {
          line = testLine;
        }
      }
      doc.text(line, 20, lineY);

      // Dates section
      yPos = Math.max(260, lineY + 15);
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Target Date:", 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(
        risk.latest_reviewed_date
          ? new Date(risk.latest_reviewed_date).toLocaleDateString()
          : "Not specified",
        20,
        yPos + 10
      );

      doc.setTextColor(100, 100, 100);
      doc.text("Review Date:", 120, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(
        risk.updated_at
          ? new Date(risk.updated_at).toLocaleDateString()
          : "Not specified",
        120,
        yPos + 10
      );

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} | Risk ID: ${
          risk.id
        }`,
        20,
        290
      );
    });

    // Save the PDF
    doc.save(`risk-detailed-${new Date().toISOString().split("T")[0]}.pdf`);
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

  if (isLoading) {
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
                      e.target.value as "summary" | "detailed"
                    )
                  }
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="summary">Summary Table</option>
                  <option value="detailed">Detailed Forms (1 per risk)</option>
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
                  <option value="excel" disabled>
                    Excel (Coming Soon)
                  </option>
                  <option value="word" disabled>
                    Word (Coming Soon)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 lg:ml-4">
            <button
              onClick={generatePDF}
              disabled={!filteredRisks.length}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export{" "}
              {selectedReportType === "detailed" ? "Detailed" : "Summary"} PDF
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
