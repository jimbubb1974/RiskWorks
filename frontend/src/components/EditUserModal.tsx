import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User as UserIcon, Settings } from "lucide-react";
import { usersService } from "../services/users";
import type { User, UserUpdate } from "../types/user";

// Simple toast notification system
const toast = {
  success: (message: string) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  },
  error: (message: string) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  },
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

// Define available roles
const ROLES = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to risks, action items, and reports",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can create and edit risks and action items",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Full access including user management and settings",
  },
];

export default function EditUserModal({
  isOpen,
  onClose,
  user,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UserUpdate>({
    email: user.email,
    role: user.role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data: UserUpdate) => usersService.updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      toast.success("User updated successfully!");
      handleClose();
    },
    onError: (error: unknown) => {
      toast.error(error.response?.data?.detail || "Failed to update user");
    },
  });

  // Update form data when user changes
  useEffect(() => {
    setFormData({
      email: user.email,
      role: user.role,
    });
  }, [user]);

  const handleClose = () => {
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);
    updateUserMutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">
                Edit User
              </h2>
              <p className="text-sm text-secondary-600">
                Update user information
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-secondary-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Basic Information
            </h3>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input w-full"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Role Field */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input w-full"
                disabled={isSubmitting}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting || !formData.email}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Update User
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
