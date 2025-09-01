import { useQuery } from "@tanstack/react-query";
import {
  Users as UsersIcon,
  Mail,
  Calendar,
  Shield,
  Eye,
  UserPlus,
  Search,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usersService } from "../services/users";

// Define User interface locally to avoid import issues
interface User {
  id: number;
  email: string;
  created_at: string;
  role?: string;
  status?: string;
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", search, roleFilter, statusFilter],
    queryFn: () =>
      usersService.getUsers({ search, role: roleFilter, status: statusFilter }),
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return "bg-danger-100 text-danger-800";
      case "manager":
        return "bg-warning-100 text-warning-800";
      case "user":
        return "bg-primary-100 text-primary-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success-100 text-success-800";
      case "inactive":
        return "bg-secondary-100 text-secondary-600";
      case "suspended":
        return "bg-danger-100 text-danger-800";
      default:
        return "bg-secondary-100 text-secondary-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            User Management
          </h1>
          <p className="text-secondary-600">
            Manage registered users and their permissions
          </p>
        </div>
        <button className="btn-primary">
          <UserPlus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-secondary-500" />
          <h3 className="font-medium text-secondary-900">Filters & Search</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-11"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            <option value="">All roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Manager">Manager</option>
            <option value="User">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-secondary-900">
            {filteredUsers.length} User{filteredUsers.length !== 1 ? "s" : ""}{" "}
            Found
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-secondary-600">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No users found
            </h3>
            <p className="text-secondary-600 mb-6">
              {search || roleFilter || statusFilter
                ? "Try adjusting your filters to see more results."
                : "No users have been registered yet."}
            </p>
            <button className="btn-primary">
              <UserPlus className="w-5 h-5 mr-2" />
              Add First User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-secondary-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-secondary-900">
                            {user.email}
                          </h4>
                          <p className="text-sm text-secondary-600">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                          user.role || "User"
                        )}`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          user.status || "active"
                        )}`}
                      >
                        {user.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-secondary-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/users/${user.id}`}
                          className="btn-ghost p-2"
                          title="View user details"
                        >
                          <Eye className="w-4 h-4" />
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
