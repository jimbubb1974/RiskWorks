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
  Eye,
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
  const highSeverityRisks = risks.filter((r) => r.severity >= 4).length;
  // const recentRisks = risks.filter((r) => {
  //   const created = new Date(r.created_at);
  //   const weekAgo = new Date();
  //   weekAgo.setDate(weekAgo.getDate() - 7);
  //   return created > weekAgo;
  // }).length;

  const averageRiskScore =
    totalRisks > 0
      ? (
          risks.reduce((sum, r) => sum + r.severity * r.probability, 0) /
          totalRisks
        ).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card-glass">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">
              Welcome back, {user?.email?.split("@")[0] || "User"}!
            </h1>
            <p className="text-secondary-600">
              Here's your risk management overview for today.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

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
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-secondary-900">
                Recent Risks
              </h2>
              <Link
                to="/risks"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {risks.slice(0, 5).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        risk.severity >= 4
                          ? "bg-danger-500"
                          : risk.severity >= 3
                          ? "bg-warning-500"
                          : "bg-success-500"
                      }`}
                    />
                    <div>
                      <h3 className="font-medium text-secondary-900 truncate max-w-xs">
                        {risk.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        Score: {risk.severity * risk.probability} •{" "}
                        {risk.status}
                      </p>
                    </div>
                  </div>
                  <Link to={`/risks/${risk.id}`} className="btn-ghost p-2">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}

              {risks.length === 0 && (
                <div className="text-center py-8 text-secondary-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No risks found. Create your first risk assessment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-6">
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
              <Link to="/risks" className="btn-secondary w-full justify-center">
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
