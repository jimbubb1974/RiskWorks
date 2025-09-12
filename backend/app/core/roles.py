"""
Role-based permission system for RiskWorks platform.
Defines standard roles with predefined permission sets.
"""

from typing import Dict, List, Set
from enum import Enum


class Role(str, Enum):
    """Available user roles."""
    VIEWER = "viewer"
    EDITOR = "editor"
    MANAGER = "manager"


class Permission(str, Enum):
    """Available permissions."""
    # Risk permissions
    VIEW_RISKS = "view_risks"
    CREATE_RISKS = "create_risks"
    EDIT_RISKS = "edit_risks"
    DELETE_RISKS = "delete_risks"
    
    # Action item permissions
    VIEW_ACTION_ITEMS = "view_action_items"
    CREATE_ACTION_ITEMS = "create_action_items"
    EDIT_ACTION_ITEMS = "edit_action_items"
    DELETE_ACTION_ITEMS = "delete_action_items"
    
    # User management permissions
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    
    # System permissions
    VIEW_SETTINGS = "view_settings"
    EDIT_SETTINGS = "edit_settings"
    VIEW_REPORTS = "view_reports"
    EXPORT_DATA = "export_data"
    
    # Snapshot permissions
    VIEW_SNAPSHOTS = "view_snapshots"
    CREATE_SNAPSHOTS = "create_snapshots"
    RESTORE_SNAPSHOTS = "restore_snapshots"
    DELETE_SNAPSHOTS = "delete_snapshots"


# Define role permissions mapping
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.VIEWER: {
        Permission.VIEW_RISKS,
        Permission.VIEW_ACTION_ITEMS,
        Permission.VIEW_REPORTS,
        Permission.VIEW_SNAPSHOTS,
    },
    
    Role.EDITOR: {
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
    },
    
    Role.MANAGER: {
        # All permissions
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
    },
}


def get_role_permissions(role: str) -> Set[Permission]:
    """Get permissions for a given role."""
    try:
        role_enum = Role(role.lower())
        return ROLE_PERMISSIONS.get(role_enum, set())
    except ValueError:
        # Invalid role, return empty set
        return set()


def has_permission(user_role: str, permission: Permission) -> bool:
    """Check if a user role has a specific permission."""
    role_permissions = get_role_permissions(user_role)
    return permission in role_permissions


def get_available_roles() -> List[Dict[str, str]]:
    """Get list of available roles with descriptions."""
    return [
        {
            "value": Role.VIEWER.value,
            "label": "Viewer",
            "description": "Read-only access to risks, action items, and reports"
        },
        {
            "value": Role.EDITOR.value,
            "label": "Editor", 
            "description": "Can create and edit risks and action items"
        },
        {
            "value": Role.MANAGER.value,
            "label": "Manager",
            "description": "Full access including user management and settings"
        }
    ]


def get_role_permissions_list(role: str) -> List[str]:
    """Get list of permission names for a role (for API responses)."""
    permissions = get_role_permissions(role)
    return [p.value for p in permissions]
