import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRisks, getRiskOwners } from "../services/risks";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: risks = [] } = useQuery({
    queryKey: ["risks"],
    queryFn: () => listRisks({}),
  });
  const { data: riskOwners = [] } = useQuery({
    queryKey: ["risk-owners"],
    queryFn: getRiskOwners,
  });

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");

  // Calculate metrics
  const totalRisks = risks.length;
  const openRisks = risks.filter((r) => r.status === "open").length;
  const highSeverityRisks = risks.filter((r) => r.probability >= 4).length;
  // const recentRisks = risks.filter((r) => {
  //   const created = new Date(r.created_at);
  //   const weekAgo = new Date();
  //   weekAgo.setDate(weekAgo.getDate() - 7);
  //   return created > weekAgo;
  // }).length;

  const averageRiskScore =
    totalRisks > 0
      ? (
          risks.reduce((sum, r) => sum + r.probability * r.impact, 0) /
          totalRisks
        ).toFixed(1)
      : 0;

  // Filters applied to matrix only
  const filteredForMatrix = useMemo(() => {
    return risks.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (ownerFilter && (r.risk_owner || "") !== ownerFilter) return false;
      return true;
    });
  }, [risks, statusFilter, ownerFilter]);

  // Build 5x5 matrix counts: rows=impact(5..1), cols=probability(1..5)
  const matrixCounts: number[][] = useMemo(() => {
    const counts = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (const r of filteredForMatrix) {
      const p = Math.min(5, Math.max(1, Number(r.probability)));
      const i = Math.min(5, Math.max(1, Number(r.impact)));
      const row = 5 - i; // impact 5 at top (row 0)
      const col = p - 1; // probability 1 at left (col 0)
      counts[row][col] += 1;
    }
    return counts;
  }, [filteredForMatrix]);

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Risks"
          value={totalRisks.toString()}
          icon={<Activity className="w-6 h-6" />}
          color="primary"
        />
        <MetricCard
          title="Open Risks"
          value={openRisks.toString()}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
        />
        <MetricCard
          title="High Priority"
          value={highSeverityRisks.toString()}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
        <MetricCard
          title="Avg Risk Score"
          value={averageRiskScore.toString()}
          icon={<BarChart3 className="w-6 h-6" />}
          color="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-3">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Create Risk */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/risks/new"
                  className="btn-primary w-full justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Risk
                </Link>
                <Link
                  to="/risks"
                  className="btn-secondary w-full justify-center"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  View All Risks
                </Link>
              </div>
            </div>

            {/* Status Overview */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Status Overview
              </h3>
              <div className="space-y-3">
                <StatusItem
                  label="Open"
                  count={openRisks}
                  color="warning"
                  icon={<Clock className="w-4 h-4" />}
                />
                <StatusItem
                  label="Mitigated"
                  count={risks.filter((r) => r.status === "mitigated").length}
                  color="primary"
                  icon={<Shield className="w-4 h-4" />}
                />
                <StatusItem
                  label="Closed"
                  count={risks.filter((r) => r.status === "closed").length}
                  color="success"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Matrix Pane */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Risk Matrix
          </h3>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="mitigated">Mitigated</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="input"
            >
              <option value="">All owners</option>
              {riskOwners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-1">
            {/* Header row */}
            <div></div>
            {[1, 2, 3, 4, 5].map((p) => (
              <div
                key={p}
                className="text-center text-xs text-secondary-600 py-1"
              >
                P{p}
              </div>
            ))}

            {/* Rows: impact 5..1 */}
            {[5, 4, 3, 2, 1].map((impactVal, rowIdx) => (
              <React.Fragment key={`row-${impactVal}`}>
                <div
                  key={`label-${impactVal}`}
                  className="text-right pr-2 text-xs text-secondary-600 flex items-center justify-end"
                >
                  I{impactVal}
                </div>
                {matrixCounts[rowIdx].map((count, colIdx) => {
                  const probabilityVal = colIdx + 1;
                  const score = probabilityVal * impactVal;
                  const isEmpty = count === 0;
                  const color = isEmpty
                    ? "bg-transparent border-secondary-200 text-secondary-400"
                    : score >= 16
                    ? "bg-danger-100 border-danger-200 text-danger-800"
                    : score >= 9
                    ? "bg-warning-100 border-warning-200 text-warning-800"
                    : "bg-success-100 border-success-200 text-success-800";
                  return (
                    <div
                      key={`cell-${rowIdx}-${colIdx}`}
                      className={`h-12 flex items-center justify-center border rounded ${color}`}
                      title={`P${probabilityVal} x I${impactVal} = ${score}`}
                    >
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-secondary-500">
          P = Probability, I = Impact
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "warning" | "danger" | "success";
}) {
  const colorClasses = {
    primary: "from-primary-500 to-primary-600",
    warning: "from-warning-500 to-warning-600",
    danger: "from-danger-500 to-danger-600",
    success: "from-success-500 to-success-600",
  };

  return (
    <div className="card group hover:scale-105 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-secondary-900 mb-1">{value}</h3>
        <p className="text-secondary-600 text-sm">{title}</p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: "warning" | "primary" | "success";
  icon: React.ReactNode;
}) {
  const colorClasses = {
    warning: "text-warning-600 bg-warning-100",
    primary: "text-primary-600 bg-primary-100",
    success: "text-success-600 bg-success-100",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="text-secondary-700 font-medium">{label}</span>
      </div>
      <span className="text-secondary-900 font-semibold">{count}</span>
    </div>
  );
}
