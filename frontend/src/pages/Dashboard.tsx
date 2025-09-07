import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { listRisks } from "../services/risks";
import {
  TrendingUp,
  TrendingDown,
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
  const { user } = useAuth();
  const { data: risks = [] } = useQuery({
    queryKey: ["risks"],
    queryFn: () => listRisks({}),
  });

  // Calculate metrics
  const totalRisks = risks.length;
  const openRisks = risks.filter((r) => r.status === "open").length;
  const highSeverityRisks = risks.filter((r) => r.likelihood >= 4).length;
  // const recentRisks = risks.filter((r) => {
  //   const created = new Date(r.created_at);
  //   const weekAgo = new Date();
  //   weekAgo.setDate(weekAgo.getDate() - 7);
  //   return created > weekAgo;
  // }).length;

  const averageRiskScore =
    totalRisks > 0
      ? (
          risks.reduce((sum, r) => sum + r.likelihood * r.impact, 0) /
          totalRisks
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Risks"
          value={totalRisks.toString()}
          change="+12%"
          trend="up"
          icon={<Activity className="w-6 h-6" />}
          color="primary"
        />
        <MetricCard
          title="Open Risks"
          value={openRisks.toString()}
          change="-5%"
          trend="down"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
        />
        <MetricCard
          title="High Priority"
          value={highSeverityRisks.toString()}
          change="+3%"
          trend="up"
          icon={<TrendingUp className="w-6 h-6" />}
          color="danger"
        />
        <MetricCard
          title="Avg Risk Score"
          value={averageRiskScore.toString()}
          change="-8%"
          trend="down"
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
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
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
        <div
          className={`flex items-center text-sm font-medium ${
            trend === "up" ? "text-success-600" : "text-danger-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          {change}
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
