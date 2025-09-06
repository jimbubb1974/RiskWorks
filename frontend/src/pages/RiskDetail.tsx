import { useEffect, useState } from "react";
import { deleteRisk, getRisk } from "../services/risks";
import { useNavigate, useParams } from "react-router-dom";
import type { Risk } from "../types/risk";


import type { ActionItem } from "../types/actionItem";
import ActionItemsList from "../components/ActionItemsList";
import ActionItemForm from "../components/ActionItemForm";
import ActionItemEditForm from "../components/ActionItemEditForm";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  Calendar,
  User,
  MapPin,
  Target,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function RiskDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<ActionItem | null>(
    null
  );

  useEffect(() => {
    async function load() {
      if (params.id) {
        const r = await getRisk(Number(params.id));
        setRisk(r);
      }
    }
    load();
  }, [params.id]);

  async function onDelete() {
    if (!params.id) return;
    await deleteRisk(Number(params.id));
    navigate("/risks");
  }

  const handleCreateActionItem = () => {
    setShowCreateForm(true);
  };

  const handleEditActionItem = (actionItem: ActionItem) => {
    setEditingActionItem(actionItem);
    setShowEditForm(true);
  };

  const handleCloseForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingActionItem(null);
  };

  if (!risk) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading risk details...</p>
        </div>
      </div>
    );
  }

  const riskScore = risk.likelihood * risk.impact;
  const getRiskLevel = () => {
    if (riskScore >= 16)
      return {
        level: "Critical",
        color: "text-danger-600",
        bg: "bg-danger-50",
        border: "border-danger-200",
      };
    if (riskScore >= 9)
      return {
        level: "High",
        color: "text-warning-600",
        bg: "bg-warning-50",
        border: "border-warning-200",
      };
    return {
      level: "Low",
      color: "text-success-600",
      bg: "bg-success-50",
      border: "border-success-200",
    };
  };
  const riskLevel = getRiskLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-accent-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/risks")}
            className="btn-secondary group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Risks
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/risks/${risk.id}/edit`)}
              className="btn-primary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Risk
            </button>
            <button onClick={onDelete} className="btn-danger">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Risk Title and Status */}
        <div className="card-glass">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                {risk.title}
              </h1>
              {risk.description && (
                <p className="text-lg text-secondary-600 leading-relaxed">
                  {risk.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <StatusBadge status={risk.status} />
              <div
                className={`px-4 py-2 rounded-lg ${riskLevel.bg} ${riskLevel.border} border`}
              >
                <span className={`text-sm font-semibold ${riskLevel.color}`}>
                  {riskLevel.level} Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Score */}
          <div className="card-glass text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                {riskScore}
              </h3>
              <p className="text-sm text-secondary-600">Risk Score</p>
              <div className="mt-3 text-xs text-secondary-500">
                Likelihood: {risk.likelihood} × Impact: {risk.impact}
              </div>
            </div>
          </div>

          {/* Severity */}
          <div className="card-glass text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-warning-100 to-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-warning-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                {risk.likelihood}
              </h3>
              <p className="text-sm text-secondary-600">Severity</p>
              <div className="mt-3">
                <SeverityBadge severity={risk.likelihood} />
              </div>
            </div>
          </div>

          {/* Probability */}
          <div className="card-glass text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                {risk.probability}
              </h3>
              <p className="text-sm text-secondary-600">Probability</p>
              <div className="mt-3">
                <ProbabilityBadge probability={risk.probability} />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Details Form-like Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="card-glass">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Risk Owner
                    </label>
                    <p className="text-secondary-900">
                      {risk.risk_owner || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Department
                    </label>
                    <p className="text-secondary-900">
                      {risk.department || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Location
                    </label>
                    <p className="text-secondary-900">
                      {risk.location || "Not specified"}
                    </p>
                  </div>
                </div>

                {risk.category && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                        Category
                      </label>
                      <p className="text-secondary-900 capitalize">
                        {risk.category}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Root Cause Analysis */}
            {risk.root_cause && (
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning-600" />
                  Root Cause Analysis
                </h3>
                <p className="text-secondary-700 leading-relaxed">
                  {risk.root_cause}
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="card-glass">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Timeline
              </h3>
              <div className="space-y-4">
                {risk.target_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
                      <Target className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                        Target Date
                      </label>
                      <p className="text-secondary-900">
                        {new Date(risk.target_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {risk.review_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-info-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-info-600" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                        Review Date
                      </label>
                      <p className="text-secondary-900">
                        {new Date(risk.review_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mitigation Strategy */}
            {risk.mitigation_strategy && (
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success-600" />
                  Mitigation Strategy
                </h3>
                <p className="text-secondary-700 leading-relaxed">
                  {risk.mitigation_strategy}
                </p>
              </div>
            )}

            {/* Contingency Plan */}
            {risk.contingency_plan && (
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-danger-600" />
                  Contingency Plan
                </h3>
                <p className="text-secondary-700 leading-relaxed">
                  {risk.contingency_plan}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Items Section */}
        <div className="card-glass">
          <ActionItemsList
            riskId={risk.id}
            onEdit={handleEditActionItem}
            onCreate={handleCreateActionItem}
          />
        </div>
      </div>

      {/* Action Item Forms */}
      <ActionItemForm
        riskId={risk.id}
        isOpen={showCreateForm}
        onClose={handleCloseForms}
      />

      {editingActionItem && (
        <ActionItemEditForm
          actionItem={editingActionItem}
          isOpen={showEditForm}
          onClose={handleCloseForms}
        />
      )}
    </div>
  );
}

// Helper Components
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getColorClass()}`}
    >
      {getIcon()}
      <span className="capitalize">{status}</span>
    </span>
  );
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
