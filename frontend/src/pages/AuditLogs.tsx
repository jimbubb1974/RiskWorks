import React, { useState, useEffect } from "react";
import { auditService } from "../services/audit";
import type { AuditLog, AuditLogFilter } from "../services/audit";
import { usePermissions } from "../hooks/usePermissions";
import { usersService } from "../services/users";
import type { User } from "../types/user";

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<
    AuditLogFilter & { user_email?: string }
  >({
    limit: 100,
    offset: 0,
  });
  const permissions = usePermissions();

  useEffect(() => {
    if (permissions.canViewAuditLogs()) {
      loadLogs();
    }
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await usersService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert user email to user ID if provided
      const filterWithUserId = { ...filter };
      if (filter.user_email) {
        const user = users.find((u) => u.email === filter.user_email);
        if (user) {
          filterWithUserId.user_id = user.id;
        }
        delete filterWithUserId.user_email;
      }

      const data = await auditService.getAuditLogs(filterWithUserId);
      setLogs(data);
    } catch (err) {
      setError("Failed to load audit logs");
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatChanges = (changes: Record<string, any>) => {
    if (!changes) return null;

    return Object.entries(changes).map(([field, change]) => (
      <div key={field} className="text-sm">
        <span className="font-medium">{field}:</span>
        <span className="text-gray-600 ml-1">
          {change.old !== undefined
            ? `${change.old} → ${change.new}`
            : change.new}
        </span>
      </div>
    ));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "status_change":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!permissions.canViewAuditLogs()) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Access Denied
              </h3>
              <div className="mt-2 text-sm text-red-700">
                You don't have permission to view audit logs.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track all changes made to risks and action items
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Entity Type
            </label>
            <select
              value={filter.entity_type || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  entity_type: e.target.value || undefined,
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="risk">Risk</option>
              <option value="action_item">Action Item</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              value={filter.action || ""}
              onChange={(e) =>
                setFilter({ ...filter, action: e.target.value || undefined })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Entity ID
            </label>
            <input
              type="number"
              value={filter.entity_id || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  entity_id: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              User
            </label>
            <select
              value={filter.user_email || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  user_email: e.target.value || undefined,
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {logs.map((log) => (
              <li key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {log.entity_type} #{log.entity_id}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">User:</span>
                        <span className="text-gray-700">
                          {log.user_email || `User ${log.user_id}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Time:</span>
                        <span className="text-gray-700">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                    </div>

                    {log.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {log.description}
                      </p>
                    )}

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Changes:
                        </h4>
                        <div className="space-y-1">
                          {formatChanges(log.changes)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No audit logs found</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
