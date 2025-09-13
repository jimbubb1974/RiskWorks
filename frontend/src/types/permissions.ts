/**
 * Permission constants for role-based access control
 */
export enum Permission {
  // Risk permissions
  VIEW_RISKS = "view_risks",
  CREATE_RISKS = "create_risks",
  EDIT_RISKS = "edit_risks",
  DELETE_RISKS = "delete_risks",

  // Action item permissions
  VIEW_ACTION_ITEMS = "view_action_items",
  CREATE_ACTION_ITEMS = "create_action_items",
  EDIT_ACTION_ITEMS = "edit_action_items",
  DELETE_ACTION_ITEMS = "delete_action_items",

  // User management permissions
  VIEW_USERS = "view_users",
  CREATE_USERS = "create_users",
  EDIT_USERS = "edit_users",
  DELETE_USERS = "delete_users",

  // System permissions
  VIEW_SETTINGS = "view_settings",
  EDIT_SETTINGS = "edit_settings",
  VIEW_REPORTS = "view_reports",
  EXPORT_DATA = "export_data",

  // Snapshot permissions
  VIEW_SNAPSHOTS = "view_snapshots",
  CREATE_SNAPSHOTS = "create_snapshots",
  RESTORE_SNAPSHOTS = "restore_snapshots",
  DELETE_SNAPSHOTS = "delete_snapshots",
}
