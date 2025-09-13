import { useQuery } from "@tanstack/react-query";
import { listRisks, getRiskOwners } from "../services/risks";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle,
  Grid3X3,
  List,
} from "lucide-react";

export default function RisksList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [riskOwner, setRiskOwner] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortBy, setSortBy] = useState<string>("score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["risks", status, search, riskOwner],
    queryFn: () =>
      listRisks({
        status: status || undefined,
        search: search || undefined,
        risk_owner: riskOwner || undefined,
      }),
  });

  const { data: riskOwners = [] } = useQuery({
    queryKey: ["risk-owners"],
    queryFn: getRiskOwners,
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // If clicking the same field, toggle order
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as sortBy and default to desc
      setSortBy(field);
      setOrder("desc");
    }
  };

  // Sort risks for table view
  const sortedRisks = [...risks].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "risk_name":
        aValue = a.risk_name?.toLowerCase() || "";
        bValue = b.risk_name?.toLowerCase() || "";
        break;
      case "probability":
        aValue = a.probability || 0;
        bValue = b.probability || 0;
        break;
      case "impact":
        aValue = a.impact || 0;
        bValue = b.impact || 0;
        break;
      case "score":
        aValue = a.score || 0;
        bValue = b.score || 0;
        break;
      case "status":
        aValue = a.status?.toLowerCase() || "";
        bValue = b.status?.toLowerCase() || "";
        break;
      case "created_at":
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case "updated_at":
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === "asc" ? -1 : 1;
    if (aValue > bValue) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Filters Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-secondary-500" />
              <h3 className="font-medium text-secondary-900">
                Filters & Search
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search risks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-11"
                />
              </div>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="mitigated">Mitigated</option>
                <option value="closed">Closed</option>
              </select>

              {/* Risk Owner Filter */}
              <select
                value={riskOwner}
                onChange={(e) => setRiskOwner(e.target.value)}
                className="input"
              >
                <option value="">All risk owners</option>
                {riskOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 lg:ml-4">
            {/* View Toggle */}
            <div className="flex items-center bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "cards"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-secondary-600 hover:text-secondary-900"
                }`}
                title="Card view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-secondary-600 hover:text-secondary-900"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => navigate("/risks/new")}
              className="btn-primary group"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Risk
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-secondary-900">
            {risks.length} Risk{risks.length !== 1 ? "s" : ""} Found
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-secondary-600">Loading risks...</span>
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No risks found
            </h3>
            <p className="text-secondary-600 mb-6">
              {search || status || riskOwner
                ? "Try adjusting your filters to see more results."
                : "Get started by creating your first risk assessment."}
            </p>
            <button
              onClick={() => navigate("/risks/new")}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Risk
            </button>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {risks.map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 text-sm text-secondary-600 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Click column headers to sort
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("risk_name")}
                  >
                    <div className="flex items-center gap-2">
                      Risk
                      <SortIndicator
                        field="risk_name"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("probability")}
                  >
                    <div className="flex items-center gap-2">
                      Probability
                      <SortIndicator
                        field="probability"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("impact")}
                  >
                    <div className="flex items-center gap-2">
                      Impact
                      <SortIndicator
                        field="impact"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Scope
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center gap-2">
                      Risk Score
                      <SortIndicator
                        field="score"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIndicator
                        field="status"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-secondary-600 cursor-pointer hover:bg-secondary-50 transition-colors select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <SortIndicator
                        field="created_at"
                        currentSort={sortBy}
                        order={order}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {sortedRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RiskSeverityIndicator severity={risk.probability} />
                        <div>
                          <h4 className="font-medium text-secondary-900 truncate max-w-xs">
                            {risk.risk_name}
                          </h4>
                          {risk.risk_description && (
                            <p className="text-sm text-secondary-600 truncate max-w-xs">
                              {risk.risk_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ProbabilityBadge probability={risk.probability} />
                    </td>
                    <td className="px-6 py-4">
                      <SeverityBadge severity={risk.impact} />
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {(risk as any).scope ?? "project"}
                    </td>
                    <td className="px-6 py-4">
                      <RiskScoreBadge score={risk.score} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={risk.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-secondary-600">
                        {new Date(risk.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/risks/${risk.id}`}
                          className="btn-ghost p-2 tooltip"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/risks/${risk.id}/edit`}
                          className="btn-ghost p-2 tooltip"
                          title="Edit risk"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
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

function RiskSeverityIndicator({ severity }: { severity: number }) {
  if (severity >= 4) {
    return <div className="w-3 h-3 rounded-full bg-danger-500" />;
  } else if (severity >= 3) {
    return <div className="w-3 h-3 rounded-full bg-warning-500" />;
  } else {
    return <div className="w-3 h-3 rounded-full bg-success-500" />;
  }
}

function SeverityBadge({ severity }: { severity: number }) {
  const getColorClass = () => {
    if (severity >= 4) return "bg-danger-100 text-danger-800";
    if (severity >= 3) return "bg-warning-100 text-warning-800";
    return "bg-success-100 text-success-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}
    >
      {severity}
    </span>
  );
}

function ProbabilityBadge({ probability }: { probability: number }) {
  const getColorClass = () => {
    if (probability >= 4) return "bg-purple-100 text-purple-800";
    if (probability >= 3) return "bg-blue-100 text-blue-800";
    return "bg-secondary-100 text-secondary-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}
    >
      {probability}
    </span>
  );
}

function RiskScoreBadge({ score }: { score: number }) {
  const getColorClass = () => {
    if (score >= 16)
      return "bg-danger-100 text-danger-800 border border-danger-200";
    if (score >= 9)
      return "bg-warning-100 text-warning-800 border border-warning-200";
    return "bg-success-100 text-success-800 border border-success-200";
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${getColorClass()}`}
    >
      {score}
    </span>
  );
}

function RiskCard({ risk }: { risk: any }) {
  const riskScore = risk.probability * risk.impact;

  return (
    <div className="group bg-white rounded-xl border border-secondary-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      {/* Header with severity indicator and gradient accent */}
      <div className="relative">
        <div
          className={`h-1 w-full ${
            riskScore >= 16
              ? "bg-gradient-to-r from-danger-400 to-danger-600"
              : riskScore >= 9
              ? "bg-gradient-to-r from-warning-400 to-warning-600"
              : "bg-gradient-to-r from-success-400 to-success-600"
          }`}
        />
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <RiskSeverityIndicator severity={risk.probability} />
              <StatusBadge status={risk.status} />
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Link
                to={`/risks/${risk.id}`}
                className="btn-ghost p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4 text-secondary-600" />
              </Link>
              <Link
                to={`/risks/${risk.id}/edit`}
                className="btn-ghost p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                title="Edit risk"
              >
                <Edit className="w-4 h-4 text-secondary-600" />
              </Link>
            </div>
          </div>

          {/* Risk title and description */}
          <h3 className="font-semibold text-secondary-900 text-lg mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {risk.risk_name}
          </h3>
          {risk.risk_description && (
            <p className="text-secondary-600 text-sm line-clamp-3 mb-4">
              {risk.risk_description}
            </p>
          )}
        </div>
      </div>

      {/* Risk metrics with enhanced visual hierarchy */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary-50 rounded-lg">
            <div className="text-xs text-secondary-500 mb-2 font-medium">
              Probability
            </div>
            <ProbabilityBadge probability={risk.probability} />
          </div>
          <div className="text-center p-3 bg-secondary-50 rounded-lg">
            <div className="text-xs text-secondary-500 mb-2 font-medium">
              Impact
            </div>
            <SeverityBadge severity={risk.impact} />
          </div>
          <div className="text-center p-3 bg-secondary-50 rounded-lg">
            <div className="text-xs text-secondary-500 mb-2 font-medium">
              Risk Score
            </div>
            <RiskScoreBadge score={riskScore} />
          </div>
        </div>
      </div>

      {/* Footer with additional info and hover effects */}
      <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-100 group-hover:bg-secondary-100 transition-colors">
        <div className="flex items-center justify-between text-xs text-secondary-600">
          <span className="font-mono">#{risk.id}</span>
          {risk.category && (
            <span className="capitalize bg-white px-3 py-1.5 rounded-full border border-secondary-200 text-xs font-medium shadow-sm">
              {risk.category}
            </span>
          )}
          {(risk as any).scope && (
            <span className="capitalize bg-white px-3 py-1.5 rounded-full border border-secondary-200 text-xs font-medium shadow-sm">
              {(risk as any).scope}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getIcon = () => {
    switch (status) {
      case "open":
        return <Clock className="w-3 h-3" />;
      case "mitigated":
        return <Shield className="w-3 h-3" />;
      case "closed":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getColorClass = () => {
    switch (status) {
      case "open":
        return "bg-warning-100 text-warning-800";
      case "mitigated":
        return "bg-primary-100 text-primary-800";
      case "closed":
        return "bg-success-100 text-success-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}
    >
      {getIcon()}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function SortIndicator({
  field,
  currentSort,
  order,
}: {
  field: string;
  currentSort: string;
  order: "asc" | "desc";
}) {
  if (currentSort !== field) {
    return <ArrowUpDown className="w-4 h-4 text-secondary-400" />;
  }

  return (
    <div className="flex flex-col">
      <div
        className={`w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent ${
          order === "asc" ? "border-b-secondary-600" : "border-b-secondary-400"
        }`}
      />
      <div
        className={`w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent ${
          order === "desc" ? "border-t-secondary-600" : "border-t-secondary-400"
        }`}
      />
    </div>
  );
}
