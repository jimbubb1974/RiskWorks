#!/usr/bin/env python3
"""
Simple Environment Switcher for Testing
This script creates and switches between equivalent environment files
"""

import os
import shutil
from pathlib import Path

def create_env_files():
    """Create two equivalent environment files for testing"""
    
    # Local environment content
    local_env_content = """# Environment Configuration - LOCAL
# Copy this file to .env and modify as needed

# Environment Type
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=postgresql+pg8000://postgres@localhost:5433/risk_platform
DATABASE_TYPE=postgresql

# Authentication
SECRET_KEY=dev-secret-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRES_MINUTES=1440

# Service URLs (Local Development)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# Cloud Configuration
CLOUD_PROVIDER=local

# Cloud URLs (empty for local)
CLOUD_DATABASE_URL=
CLOUD_FRONTEND_URL=
CLOUD_BACKEND_URL=

# Environment Identifier - LOCAL
ENV_IDENTIFIER=LOCAL_DEVELOPMENT
ENV_DESCRIPTION=Local PostgreSQL database with localhost services
ENV_TIMESTAMP=2024-01-01_LOCAL
"""

    # Cloud environment content (different for testing)
    cloud_env_content = """# Environment Configuration - CLOUD
# Copy this file to .env and modify as needed

# Environment Type
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=postgresql+pg8000://postgres@localhost:5433/risk_platform
DATABASE_TYPE=postgresql

# Authentication
SECRET_KEY=dev-secret-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRES_MINUTES=1440

# Service URLs (Local Development)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# Cloud Configuration
CLOUD_PROVIDER=cloud

# Cloud URLs (empty for local)
CLOUD_DATABASE_URL=
CLOUD_FRONTEND_URL=
CLOUD_BACKEND_URL=

# Environment Identifier - CLOUD
ENV_IDENTIFIER=CLOUD_DEVELOPMENT
ENV_DESCRIPTION=Cloud environment with PostgreSQL database
ENV_TIMESTAMP=2024-01-01_CLOUD
"""

    backend_dir = Path(__file__).parent
    
    # Create .env.local
    local_file = backend_dir / ".env.local"
    with open(local_file, 'w') as f:
        f.write(local_env_content)
    print(f"✅ Created {local_file}")
    
    # Create .env.cloud
    cloud_file = backend_dir / ".env.cloud"
    with open(cloud_file, 'w') as f:
        f.write(cloud_env_content)
    print(f"✅ Created {cloud_file}")
    
    # Create .env (copy from local)
    env_file = backend_dir / ".env"
    shutil.copy2(local_file, env_file)
    print(f"✅ Created {env_file} (copied from .env.local)")
    
    print("\n🎯 Environment files created successfully!")
    print("   .env.local  - Local configuration (PostgreSQL)")
    print("   .env.cloud  - Cloud configuration (PostgreSQL)")
    print("   .env        - Active configuration (currently local)")

def switch_to_local():
    """Switch to local environment"""
    backend_dir = Path(__file__).parent
    local_file = backend_dir / ".env.local"
    env_file = backend_dir / ".env"
    
    if not local_file.exists():
        print("❌ .env.local not found. Run create_env_files() first.")
        return
    
    shutil.copy2(local_file, env_file)
    print("✅ Switched to LOCAL environment")
    print("   Active: .env (copied from .env.local)")

def switch_to_cloud():
    """Switch to cloud environment"""
    backend_dir = Path(__file__).parent
    cloud_file = backend_dir / ".env.cloud"
    env_file = backend_dir / ".env"
    
    if not cloud_file.exists():
        print("❌ .env.cloud not found. Run create_env_files() first.")
        return
    
    shutil.copy2(cloud_file, env_file)
    print("✅ Switched to CLOUD environment")
    print("   Active: .env (copied from .env.cloud)")

def regenerate_env_files():
    """Regenerate environment files with updated configuration"""
    print("🔄 Regenerating environment files with updated configuration...")
    create_env_files()
    print("✅ Environment files regenerated successfully!")

def show_status():
    """Show current environment status"""
    backend_dir = Path(__file__).parent
    env_file = backend_dir / ".env"
    local_file = backend_dir / ".env.local"
    cloud_file = backend_dir / ".env.cloud"
    
    print("📊 Environment Status:")
    print(f"   Active: {env_file.name}")
    print(f"   Local:  {local_file.name} {'✅' if local_file.exists() else '❌'}")
    print(f"   Cloud:  {cloud_file.name} {'✅' if cloud_file.exists() else '❌'}")
    
    if env_file.exists():
        # Check which one it matches
        with open(env_file, 'r') as f:
            env_content = f.read()
        
        with open(local_file, 'r') as f:
            local_content = f.read()
        
        with open(cloud_file, 'r') as f:
            cloud_content = f.read()
        
        if env_content == local_content:
            print("   Current: LOCAL configuration")
        elif env_content == cloud_content:
            print("   Current: CLOUD configuration")
        else:
            print("   Current: CUSTOM configuration (modified)")
        
        # Show the environment identifier for verification
        for line in env_content.split('\n'):
            if line.startswith('ENV_IDENTIFIER='):
                print(f"   Active: {line}")
                break

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("🔧 Simple Environment Switcher")
        print("Usage:")
        print("  python simple_env_switch.py create      - Create environment files")
        print("  python simple_env_switch.py regenerate  - Regenerate with updated config")
        print("  python simple_env_switch.py local       - Switch to local")
        print("  python simple_env_switch.py cloud       - Switch to cloud")
        print("  python simple_env_switch.py status      - Show current status")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "create":
        create_env_files()
    elif command == "regenerate":
        regenerate_env_files()
    elif command == "local":
        switch_to_local()
    elif command == "cloud":
        switch_to_cloud()
    elif command == "status":
        show_status()
    else:
        print(f"❌ Unknown command: {command}")
        print("Use: create, regenerate, local, cloud, or status")
