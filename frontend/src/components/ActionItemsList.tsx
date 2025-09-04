import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  Target,
} from "lucide-react";
import type { ActionItem } from "../types/actionItem";
import {
  getActionItems,
  deleteActionItem,
  updateActionItemStatus,
} from "../services/api";

interface ActionItemsListProps {
  riskId: number;
  onEdit?: (actionItem: ActionItem) => void;
  onCreate?: () => void;
}

export default function ActionItemsList({
  riskId,
  onEdit,
  onCreate,
}: ActionItemsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const {
    data: actionItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["actionItems", riskId, statusFilter],
    queryFn: () =>
      getActionItems({
        risk_id: riskId,
        ...(statusFilter !== "all" && { status: statusFilter }),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", riskId] });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      progress,
    }: {
      id: number;
      status: string;
      progress?: number;
    }) => updateActionItemStatus(id, status, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", riskId] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case "mitigation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "contingency":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "monitoring":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    const progress = newStatus === "completed" ? 100 : undefined;
    statusUpdateMutation.mutate({ id, status: newStatus, progress });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this action item?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading)
    return <div className="text-center py-4">Loading action items...</div>;
  if (error)
    return (
      <div className="text-center py-4 text-red-600">
        Error loading action items
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Action Item
        </button>
      </div>

      {/* Action Items List */}
      {actionItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No action items found for this risk.</p>
          <p className="text-sm">Click "Add Action Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionItems.map((actionItem) => (
            <div
              key={actionItem.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(actionItem.status)}
                    <h4 className="font-medium text-gray-900">
                      {actionItem.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                        actionItem.priority
                      )}`}
                    >
                      {actionItem.priority}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getActionTypeColor(
                        actionItem.action_type
                      )}`}
                    >
                      {actionItem.action_type}
                    </span>
                  </div>

                  {actionItem.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {actionItem.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {actionItem.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due:{" "}
                        {new Date(actionItem.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Progress: {actionItem.progress_percentage}%
                    </div>
                    {actionItem.assigned_to && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Assigned
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Status dropdown */}
                  <select
                    value={actionItem.status}
                    onChange={(e) =>
                      handleStatusChange(actionItem.id, e.target.value)
                    }
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={statusUpdateMutation.isPending}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Action buttons */}
                  <button
                    onClick={() => onEdit?.(actionItem)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(actionItem.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${actionItem.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
