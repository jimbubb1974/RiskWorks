#!/usr/bin/env python3
"""
Test script to verify PostgreSQL configuration and connection
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.core.config import settings
from app.database import create_database_engine

def test_postgresql_config():
    """Test PostgreSQL configuration"""
    print("🔍 Testing PostgreSQL Configuration...")
    print(f"Environment: {settings.environment}")
    print(f"Database Type: {settings.database_type}")
    print(f"Database URL: {settings.database_url}")
    print(f"Effective Database URL: {settings.effective_database_url}")
    print(f"Is Cloud: {settings.is_cloud}")
    
    if settings.cloud_database_url:
        print(f"Cloud Database URL: {settings.cloud_database_url}")
    
    print("\n🚀 Testing Database Engine Creation...")
    try:
        engine = create_database_engine()
        print(f"✅ Database engine created successfully: {type(engine)}")
        print(f"Database URL: {engine.url}")
        
        # Test connection
        with engine.connect() as conn:
            print("✅ Database connection successful!")
            
            # Test a simple query
            from sqlalchemy import text
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            print(f"✅ Test query successful: {row}")
            
    except Exception as e:
        print(f"❌ Error creating database engine: {e}")
        return False
    
    return True

def test_environment_switching():
    """Test environment switching"""
    print("\n🔄 Testing Environment Switching...")
    
    # Test development environment
    os.environ["ENVIRONMENT"] = "development"
    os.environ["DATABASE_TYPE"] = "sqlite"
    
    from app.core.config import Settings
    dev_settings = Settings()
    print(f"Development - Database Type: {dev_settings.database_type}")
    print(f"Development - Database URL: {dev_settings.database_url}")
    
    # Test production environment
    os.environ["ENVIRONMENT"] = "production"
    os.environ["DATABASE_TYPE"] = "postgresql"
    os.environ["CLOUD_DATABASE_URL"] = "postgresql://user:pass@host:5432/db"
    
    prod_settings = Settings()
    print(f"Production - Database Type: {prod_settings.database_type}")
    print(f"Production - Database URL: {prod_settings.database_url}")
    print(f"Production - Cloud Database URL: {prod_settings.cloud_database_url}")
    print(f"Production - Effective Database URL: {prod_settings.effective_database_url}")

if __name__ == "__main__":
    print("🧪 PostgreSQL Configuration Test Suite")
    print("=" * 50)
    
    # Test current configuration
    success = test_postgresql_config()
    
    # Test environment switching
    test_environment_switching()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! PostgreSQL configuration is working.")
    else:
        print("❌ Some tests failed. Check the configuration.")
