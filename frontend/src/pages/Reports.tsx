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

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text("RiskWorks - Risk Summary Report", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Total Risks: ${filteredRisks.length}`, 20, 45);

    // Filters applied
    if (selectedCategory !== "all" || selectedStatus !== "all") {
      doc.text("Filters Applied:", 20, 60);
      let yPos = 70;
      if (selectedCategory !== "all") {
        doc.text(`Category: ${selectedCategory}`, 30, yPos);
        yPos += 10;
      }
      if (selectedStatus !== "all") {
        doc.text(`Status: ${selectedStatus}`, 30, yPos);
        yPos += 10;
      }
      yPos += 10;
    }

    // Risk table
    let yPos = 90;
    const startX = 20;
    const colWidths = [40, 30, 25, 25, 30, 30];

    // Table headers
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    doc.rect(startX, yPos - 5, 190, 8, "F");

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
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, yPos - 3, 190, 8, "F");
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

      // Truncate long text
      const title =
        risk.title.length > 25
          ? risk.title.substring(0, 22) + "..."
          : risk.title;
      const category = risk.category || "N/A";
      const status = risk.status
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const owner = risk.risk_owner || "Unassigned";

      doc.text(title, startX + 2, yPos);
      doc.text(category, startX + colWidths[0] + 2, yPos);
      doc.text(
        status,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
        yPos
      );
      doc.text(
        owner,
        startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2,
        yPos
      );
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

      yPos += 10;
    });

    // Summary statistics
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text("Summary Statistics", 20, yPos);

    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const highRisks = filteredRisks.filter(
      (r) => r.risk_level === "High"
    ).length;
    const mediumRisks = filteredRisks.filter(
      (r) => r.risk_level === "Medium"
    ).length;
    const lowRisks = filteredRisks.filter((r) => r.risk_level === "Low").length;

    doc.text(`High Risk Items: ${highRisks}`, 20, yPos);
    yPos += 10;
    doc.text(`Medium Risk Items: ${mediumRisks}`, 20, yPos);
    yPos += 10;
    doc.text(`Low Risk Items: ${lowRisks}`, 20, yPos);

    // Save the PDF
    doc.save(`risk-summary-${new Date().toISOString().split("T")[0]}.pdf`);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Reports</h1>
          <p className="text-secondary-600 mt-2">
            Generate and export risk reports in various formats
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePDF}
            disabled={!filteredRisks.length}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                setSelectedFormat(e.target.value as "pdf" | "excel" | "word")
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
                        {risk.title}
                      </div>
                      {risk.description && (
                        <div className="text-sm text-secondary-600 truncate max-w-xs">
                          {risk.description}
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
