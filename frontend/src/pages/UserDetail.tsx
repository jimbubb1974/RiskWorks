import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  User as UserIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { usersService } from "../services/users";
import EditUserModal from "../components/EditUserModal";

// Define User interface locally
// interface User {
//   id: number;
//   email: string;
//   hashed_password: string;
//   plain_password?: string; // For development - shows actual password
//   created_at: string;
//   role?: string;
//   status?: string;
// }

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersService.getUser(userId),
    enabled: !!userId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "manager":
        return "bg-danger-100 text-danger-800";
      case "editor":
        return "bg-warning-100 text-warning-800";
      case "viewer":
        return "bg-primary-100 text-primary-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-secondary-600">Loading user details...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          User not found
        </h3>
        <p className="text-secondary-600 mb-6">
          The user you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/app/users" className="btn-primary">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/app/users"
            className="btn-ghost p-2 hover:bg-secondary-100"
            title="Back to Users"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit User
          </button>
          <button className="btn-ghost text-danger-600 hover:bg-danger-50">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="card">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
            {user.email.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                {user.email}
              </h2>
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                    user.role || "User"
                  )}`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role || "User"}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
                <Mail className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Email
                  </p>
                  <p className="text-sm text-secondary-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
                <Calendar className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Joined
                  </p>
                  <p className="text-sm text-secondary-600">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
                <Shield className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Role</p>
                  <p className="text-sm text-secondary-600">
                    {user.role || "User"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
                <UserIcon className="w-5 h-5 text-secondary-500" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
                <Shield className="w-5 h-5 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    Password (Dev)
                  </p>
                  <p className="text-xs text-secondary-600 font-mono break-all">
                    {user.plain_password || "No password stored"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity History */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
              <div className="w-2 h-2 rounded-full bg-success-500"></div>
              <div className="flex-1">
                <p className="text-sm text-secondary-900">User logged in</p>
                <p className="text-xs text-secondary-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              <div className="flex-1">
                <p className="text-sm text-secondary-900">Profile updated</p>
                <p className="text-xs text-secondary-600">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {user && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
