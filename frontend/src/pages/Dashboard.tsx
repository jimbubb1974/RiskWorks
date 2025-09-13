import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRisks, getRiskOwners } from "../services/risks";
import { listRBSTree, type RBSNode } from "../services/rbs";
import { usePermissions } from "../hooks/usePermissions";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Plus,
  Network,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const permissions = usePermissions();

  const { data: risks = [] } = useQuery({
    queryKey: ["risks"],
    queryFn: () => listRisks({}),
    enabled: permissions.canViewRisks(),
  });
  const { data: riskOwners = [] } = useQuery({
    queryKey: ["risk-owners"],
    queryFn: getRiskOwners,
    enabled: permissions.canViewRisks(),
  });

  const { data: rbsTree = [] } = useQuery({
    queryKey: ["rbs-tree"],
    queryFn: listRBSTree,
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

  // Calculate risk counts for RBS nodes
  const rbsRiskCounts = useMemo(() => {
    const counts: { [key: number]: number } = {};

    // Count risks for each RBS node
    risks.forEach((risk) => {
      if (risk.rbs_node_id) {
        counts[risk.rbs_node_id] = (counts[risk.rbs_node_id] || 0) + 1;
      }
    });

    return counts;
  }, [risks]);

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
                {permissions.canCreateRisks() && (
                  <Link
                    to="/app/risks/new"
                    className="btn-primary w-full justify-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Risk
                  </Link>
                )}
                {permissions.canViewRisks() && (
                  <Link
                    to="/app/risks"
                    className="btn-secondary w-full justify-center"
                  >
                    <Activity className="w-5 h-5 mr-2" />
                    View All Risks
                  </Link>
                )}
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

      {/* RBS Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Risk Distribution
          </h3>
          <Link to="/app/rbs" className="btn-secondary text-sm">
            <Network className="w-4 h-4 mr-2" />
            Manage RBS
          </Link>
        </div>

        <RBSVisualization rbsTree={rbsTree} riskCounts={rbsRiskCounts} />
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

function RBSVisualization({
  rbsTree,
  riskCounts,
}: {
  rbsTree: (RBSNode & { children?: RBSNode[] })[];
  riskCounts: { [key: number]: number };
}) {
  if (rbsTree.length === 0) {
    return (
      <div className="text-center py-8 text-secondary-500">
        <Network className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
        <p>No RBS categories defined yet.</p>
        <p className="text-sm">
          Create your first RBS category to get started.
        </p>
      </div>
    );
  }

  // Calculate maximum risk count for bar scaling
  const maxRiskCount = Math.max(...Object.values(riskCounts), 1);

  // Calculate maximum title width by flattening the tree and finding the longest title
  const flattenTree = (
    nodes: (RBSNode & { children?: RBSNode[] })[],
    level = 0
  ): { name: string; level: number }[] => {
    const result: { name: string; level: number }[] = [];
    for (const node of nodes) {
      result.push({ name: node.name, level });
      if (node.children && node.children.length) {
        result.push(...flattenTree(node.children, level + 1));
      }
    }
    return result;
  };

  const allNodes = flattenTree(rbsTree);
  const maxTitleLength = Math.max(
    ...allNodes.map((node) => node.name.length),
    10
  );
  const maxLevel = Math.max(...allNodes.map((n) => n.level), 0);
  const maxIndentPx = maxLevel * 20;
  // Approximate label column width including max indentation and some padding
  const labelColumnWidth = Math.min(maxIndentPx + maxTitleLength * 7 + 48, 260);

  return (
    <div className="space-y-0.5">
      {rbsTree.map((node) => (
        <RBSNodeItem
          key={node.id}
          node={node}
          riskCount={riskCounts[node.id] || 0}
          riskCounts={riskCounts}
          level={0}
          maxRiskCount={maxRiskCount}
          labelColumnWidth={labelColumnWidth}
        />
      ))}
    </div>
  );
}

function RBSNodeItem({
  node,
  riskCount,
  riskCounts,
  level,
  maxRiskCount,
  labelColumnWidth,
}: {
  node: RBSNode & { children?: RBSNode[] };
  riskCount: number;
  riskCounts: { [key: number]: number };
  level: number;
  maxRiskCount: number;
  labelColumnWidth: number;
}) {
  const indent = level * 20;
  const hasChildren = node.children && node.children.length > 0;

  // Calculate bar width as percentage of max risk count
  const barWidth = maxRiskCount > 0 ? (riskCount / maxRiskCount) * 100 : 0;

  // Use a single color for all bars
  const getBarColor = (count: number) => {
    return count === 0 ? "bg-secondary-100" : "bg-primary-200";
  };

  return (
    <div>
      <div className="py-2 px-3 rounded-lg hover:bg-secondary-50 transition-colors">
        <div
          className="items-center"
          style={{
            display: "grid",
            gridTemplateColumns: `${labelColumnWidth}px 120px 1fr`,
            columnGap: "12px",
            alignItems: "center",
          }}
        >
          {/* Label column: indentation + title */}
          <div className="flex items-center min-w-0">
            {/* Indentation for hierarchy */}
            <div style={{ width: `${indent}px` }} className="flex-shrink-0" />
            {level > 0 && (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-secondary-300 rounded-full"></div>
              </div>
            )}
            <span className="font-medium text-secondary-900 truncate ml-1">
              {node.name}
            </span>
          </div>

          {/* Bar column: fixed start, left-aligned */}
          <div className="flex items-center gap-2 justify-self-start">
            <div className="w-20 h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getBarColor(
                  riskCount
                )}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-xs font-medium text-secondary-600">
              {riskCount}
            </span>
          </div>

          {/* Description (subcategory label removed) */}
          <div className="flex items-center gap-3 min-w-0">
            {node.description && (
              <span className="text-sm text-secondary-600 truncate max-w-xs hidden sm:block">
                {node.description}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasChildren && (
        <div>
          {node.children!.map((child) => (
            <RBSNodeItem
              key={child.id}
              node={child}
              riskCount={riskCounts[child.id] || 0}
              riskCounts={riskCounts}
              level={level + 1}
              maxRiskCount={maxRiskCount}
              labelColumnWidth={labelColumnWidth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
