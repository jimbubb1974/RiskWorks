import { useQuery } from "@tanstack/react-query";
import { listRisks } from "../services/risks";
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
  MoreHorizontal,
} from "lucide-react";

export default function RisksList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [minSeverity, setMinSeverity] = useState<number | "">("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ["risks", status, minSeverity, search, sortBy, order],
    queryFn: () =>
      listRisks({
        status: status || undefined,
        min_severity: typeof minSeverity === "number" ? minSeverity : undefined,
        search: search || undefined,
        sort_by: sortBy || undefined,
        order,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Risk Management
          </h1>
          <p className="text-secondary-600">
            Monitor and assess organizational risks
          </p>
        </div>
        <button
          onClick={() => navigate("/risks/new")}
          className="btn-primary group"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Risk
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-secondary-500" />
          <h3 className="font-medium text-secondary-900">Filters & Search</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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

          {/* Severity Filter */}
          <input
            type="number"
            min={1}
            max={5}
            placeholder="Min severity"
            value={minSeverity}
            onChange={(e) =>
              setMinSeverity(e.target.value ? Number(e.target.value) : "")
            }
            className="input"
          />

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="severity">Severity</option>
            <option value="probability">Probability</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
            className="btn-secondary justify-center"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {order === "asc" ? "Ascending" : "Descending"}
          </button>
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
              {search || status || minSeverity
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Risk
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Probability
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Risk Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {risks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <RiskSeverityIndicator severity={risk.severity} />
                        <div>
                          <h4 className="font-medium text-secondary-900 truncate max-w-xs">
                            {risk.title}
                          </h4>
                          {risk.description && (
                            <p className="text-sm text-secondary-600 truncate max-w-xs">
                              {risk.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <SeverityBadge severity={risk.severity} />
                    </td>
                    <td className="px-6 py-4">
                      <ProbabilityBadge probability={risk.probability} />
                    </td>
                    <td className="px-6 py-4">
                      <RiskScoreBadge
                        score={risk.severity * risk.probability}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={risk.status} />
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
