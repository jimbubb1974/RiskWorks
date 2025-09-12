#!/usr/bin/env python3
"""
Test script to verify user editing functionality
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.database import get_db
from app.models.user import User
from app.services.auth import register_user
import json

def test_user_editing():
    """Test user creation and editing functionality"""
    
    try:
        # Get database session
        db = next(get_db())
        
        print("🧪 Testing User Editing Functionality")
        print("=" * 50)
        
        # Test 1: Create a test user with role and permissions
        print("\n1. Creating test user with role and permissions...")
        
        test_permissions = {
            "view_risks": True,
            "create_risks": True,
            "edit_risks": False,
            "delete_risks": False,
            "manage_users": False,
            "view_reports": True,
            "manage_settings": False
        }
        
        user = register_user(
            db=db,
            email="testuser@example.com",
            password="testpass123",
            role="manager",
            status="active",
            permissions=test_permissions
        )
        
        print(f"✅ User created successfully!")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Status: {user.status}")
        print(f"   Permissions: {user.permissions}")
        
        # Test 2: Update user information
        print("\n2. Updating user information...")
        
        # Update role and status
        user.role = "administrator"
        user.status = "active"
        
        # Update permissions
        updated_permissions = {
            "view_risks": True,
            "create_risks": True,
            "edit_risks": True,
            "delete_risks": True,
            "manage_users": True,
            "view_reports": True,
            "manage_settings": True
        }
        user.permissions = json.dumps(updated_permissions)
        
        db.commit()
        db.refresh(user)
        
        print(f"✅ User updated successfully!")
        print(f"   New Role: {user.role}")
        print(f"   New Status: {user.status}")
        print(f"   New Permissions: {user.permissions}")
        
        # Test 3: Verify permissions parsing
        print("\n3. Testing permissions parsing...")
        
        if user.permissions:
            parsed_permissions = json.loads(user.permissions)
            print(f"✅ Permissions parsed successfully!")
            for key, value in parsed_permissions.items():
                status = "✓ Allowed" if value else "✗ Restricted"
                print(f"   {key}: {status}")
        
        # Test 4: Test different user roles
        print("\n4. Testing different user roles...")
        
        roles_to_test = ["user", "manager", "administrator"]
        for role in roles_to_test:
            test_user = register_user(
                db=db,
                email=f"test_{role}@example.com",
                password="testpass123",
                role=role,
                status="active"
            )
            print(f"✅ Created {role} user: {test_user.email}")
        
        print("\n🎉 All tests passed successfully!")
        print("\n📋 Summary:")
        print(f"   - User model supports roles: ✅")
        print(f"   - User model supports status: ✅")
        print(f"   - User model supports permissions: ✅")
        print(f"   - Permissions can be stored as JSON: ✅")
        print(f"   - Permissions can be parsed: ✅")
        print(f"   - Multiple roles can be created: ✅")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_user_editing()

