import { useAuth } from "../context/AuthContext";
import { Permission } from "../types/permissions";

/**
 * Hook to check user permissions based on their role
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Define role permissions mapping
    const rolePermissions: Record<string, Permission[]> = {
      viewer: [
        Permission.VIEW_RISKS,
        Permission.VIEW_ACTION_ITEMS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_SNAPSHOTS,
      ],
      editor: [
        Permission.VIEW_RISKS,
        Permission.CREATE_RISKS,
        Permission.EDIT_RISKS,
        Permission.DELETE_RISKS,
        Permission.VIEW_ACTION_ITEMS,
        Permission.CREATE_ACTION_ITEMS,
        Permission.EDIT_ACTION_ITEMS,
        Permission.DELETE_ACTION_ITEMS,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_SNAPSHOTS,
        Permission.CREATE_SNAPSHOTS,
      ],
      manager: [
        // All permissions
        Permission.VIEW_RISKS,
        Permission.CREATE_RISKS,
        Permission.EDIT_RISKS,
        Permission.DELETE_RISKS,
        Permission.VIEW_ACTION_ITEMS,
        Permission.CREATE_ACTION_ITEMS,
        Permission.EDIT_ACTION_ITEMS,
        Permission.DELETE_ACTION_ITEMS,
        Permission.VIEW_USERS,
        Permission.CREATE_USERS,
        Permission.EDIT_USERS,
        Permission.DELETE_USERS,
        Permission.VIEW_SETTINGS,
        Permission.EDIT_SETTINGS,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
        Permission.VIEW_SNAPSHOTS,
        Permission.CREATE_SNAPSHOTS,
        Permission.RESTORE_SNAPSHOTS,
        Permission.DELETE_SNAPSHOTS,
        Permission.VIEW_AUDIT_LOGS,
      ],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const canViewRisks = () => hasPermission(Permission.VIEW_RISKS);
  const canCreateRisks = () => hasPermission(Permission.CREATE_RISKS);
  const canEditRisks = () => hasPermission(Permission.EDIT_RISKS);
  const canDeleteRisks = () => hasPermission(Permission.DELETE_RISKS);

  const canViewUsers = () => hasPermission(Permission.VIEW_USERS);
  const canCreateUsers = () => hasPermission(Permission.CREATE_USERS);
  const canEditUsers = () => hasPermission(Permission.EDIT_USERS);
  const canDeleteUsers = () => hasPermission(Permission.DELETE_USERS);

  const canViewSettings = () => hasPermission(Permission.VIEW_SETTINGS);
  const canEditSettings = () => hasPermission(Permission.EDIT_SETTINGS);

  const canViewReports = () => hasPermission(Permission.VIEW_REPORTS);
  const canExportData = () => hasPermission(Permission.EXPORT_DATA);
  const canViewAuditLogs = () => hasPermission(Permission.VIEW_AUDIT_LOGS);

  return {
    hasPermission,
    canViewRisks,
    canCreateRisks,
    canEditRisks,
    canDeleteRisks,
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canViewSettings,
    canEditSettings,
    canViewReports,
    canExportData,
    canViewAuditLogs,
  };
}
