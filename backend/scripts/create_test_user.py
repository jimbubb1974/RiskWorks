#!/usr/bin/env python3
"""
Quick script to create a test user for development
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.database import get_db
from app.services.auth import register_user

def create_test_user():
    """Create a test user account"""
    
    # Test user credentials
    email = "test@example.com"
    password = "password123"
    
    try:
        # Get database session
        db = next(get_db())
        
        # Check if user already exists
        from app.models.user import User
        existing = db.query(User).filter(User.email == email).first()
        
        if existing:
            print(f"✅ Test user already exists!")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            return
        
        # Create the test user
        user = register_user(db, email=email, password=password)
        
        print(f"✅ Test user created successfully!")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"🆔 User ID: {user.id}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
