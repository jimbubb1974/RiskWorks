import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deleteRisk, getRisk } from "../services/risks";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Risk } from "../types/risk";
import { listRBSTree, type RBSNode } from "../services/rbs";

import type { ActionItem } from "../types/actionItem";
import ActionItemsList from "../components/ActionItemsList";
import ActionItemForm from "../components/ActionItemForm";
import ActionItemEditForm from "../components/ActionItemEditForm";
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";

export default function RiskDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<ActionItem | null>(
    null
  );
  const [showProbabilityBasis, setShowProbabilityBasis] = useState(false);
  const [showImpactBasis, setShowImpactBasis] = useState(false);
  const { data: rbsTree = [] } = useQuery({
    queryKey: ["rbs-tree"],
    queryFn: listRBSTree,
  });

  function findNodeById(
    nodes: (RBSNode & { children?: RBSNode[] })[],
    id?: number | null
  ): RBSNode | undefined {
    if (!id) return undefined;
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = n.children ? findNodeById(n.children, id) : undefined;
      if (found) return found;
    }
    return undefined;
  }

  function findNodePath(
    nodes: (RBSNode & { children?: RBSNode[] })[],
    id?: number | null,
    path: RBSNode[] = []
  ): RBSNode[] | null {
    if (!id) return null;
    for (const n of nodes) {
      const nextPath = [...path, n];
      if (n.id === id) return nextPath;
      if (n.children && n.children.length) {
        const found = findNodePath(n.children, id, nextPath);
        if (found) return found;
      }
    }
    return null;
  }

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
    // Invalidate risks cache to refresh the list
    queryClient.invalidateQueries({ queryKey: ["risks"] });
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

  const riskScore = risk.probability * risk.impact;
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
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                  ID: {risk.id}
                </span>
                <StatusBadge status={risk.status} />
              </div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                {risk.risk_name}
              </h1>
              {risk.risk_description && (
                <p className="text-lg text-secondary-600 leading-relaxed">
                  {risk.risk_description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
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
                    <Calendar className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Latest Reviewed
                    </label>
                    <p className="text-secondary-900">
                      {risk.latest_reviewed_date
                        ? new Date(
                            risk.latest_reviewed_date
                          ).toLocaleDateString()
                        : "Never reviewed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Scope
                    </label>
                    <p className="text-secondary-900 capitalize">
                      {(risk as any).scope || "Project"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      RBS Category
                    </label>
                    <p className="text-secondary-900">
                      {(() => {
                        const path = findNodePath(
                          rbsTree as any,
                          risk.rbs_node_id as any
                        );
                        return path && path.length
                          ? path.map((n) => n.name).join(" / ")
                          : "Not linked";
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Created By (Owner ID)
                    </label>
                    <p className="text-secondary-900">
                      User ID: {risk.owner_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Risk Assessment Details */}
            <div className="card-glass">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Risk Assessment
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Probability
                    </label>
                    <p className="text-secondary-900">{risk.probability}/5</p>
                  </div>
                  <button
                    onClick={() =>
                      setShowProbabilityBasis(!showProbabilityBasis)
                    }
                    className="p-1 hover:bg-secondary-100 rounded transition-colors"
                    title={
                      showProbabilityBasis
                        ? "Hide justification"
                        : "Show justification"
                    }
                  >
                    {showProbabilityBasis ? (
                      <ChevronDown className="w-4 h-4 text-secondary-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-secondary-600" />
                    )}
                  </button>
                </div>
                {showProbabilityBasis && (
                  <div className="ml-11 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-2 block">
                      Probability Basis
                    </label>
                    {risk.probability_basis ? (
                      <p className="text-secondary-700 text-sm leading-relaxed">
                        {risk.probability_basis}
                      </p>
                    ) : (
                      <p className="text-secondary-500 italic text-sm">
                        No probability justification provided
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Impact
                    </label>
                    <p className="text-secondary-900">{risk.impact}/5</p>
                  </div>
                  <button
                    onClick={() => setShowImpactBasis(!showImpactBasis)}
                    className="p-1 hover:bg-secondary-100 rounded transition-colors"
                    title={
                      showImpactBasis
                        ? "Hide justification"
                        : "Show justification"
                    }
                  >
                    {showImpactBasis ? (
                      <ChevronDown className="w-4 h-4 text-secondary-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-secondary-600" />
                    )}
                  </button>
                </div>
                {showImpactBasis && (
                  <div className="ml-11 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide mb-2 block">
                      Impact Basis
                    </label>
                    {risk.impact_basis ? (
                      <p className="text-secondary-700 text-sm leading-relaxed">
                        {risk.impact_basis}
                      </p>
                    ) : (
                      <p className="text-secondary-500 italic text-sm">
                        No impact justification provided
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Risk Score
                    </label>
                    <p className="text-secondary-900 font-semibold">
                      {riskScore}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-info-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                      Risk Level
                    </label>
                    <p className="text-secondary-900 font-semibold">
                      {risk.risk_level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes - Full Width */}
        <div className="card-glass">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary-600" />
            Notes
          </h3>
          <div>
            {(risk as any).notes ? (
              <p className="text-secondary-700 text-sm leading-relaxed whitespace-pre-wrap">
                {(risk as any).notes}
              </p>
            ) : (
              <p className="text-secondary-500 italic text-sm">
                No notes provided
              </p>
            )}
          </div>
        </div>

        {/* Audit Information */}
        <div className="card-glass">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary-600" />
            Audit Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-secondary-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                  Created At
                </label>
                <p className="text-secondary-900">
                  {new Date(risk.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-secondary-600" />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="text-secondary-900">
                  {new Date(risk.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
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
        return <TrendingUp className="w-3 h-3" />;
      case "draft":
        return <FileText className="w-3 h-3" />;
      case "closed":
        return <TrendingUp className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getColorClass = () => {
    switch (status) {
      case "open":
        return "bg-warning-100 text-warning-800";
      case "draft":
        return "bg-secondary-100 text-secondary-800";
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
