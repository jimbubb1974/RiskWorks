#!/usr/bin/env python3
"""
Switch backend environment to cloud (Render) configuration
"""

import shutil
import os
from pathlib import Path

def switch_to_cloud():
    """Switch backend to cloud configuration"""
    backend_dir = Path(__file__).parent
    
    # Paths to environment files
    env_file = backend_dir / ".env"
    env_cloud = backend_dir / ".env.cloud"
    env_backup = backend_dir / ".env.backup"
    
    print("🔄 Switching backend to cloud configuration...")
    
    # Check if cloud config exists
    if not env_cloud.exists():
        print("❌ Error: .env.cloud file not found!")
        return False
    
    # Backup current .env file
    if env_file.exists():
        print("📋 Backing up current .env file...")
        shutil.copy2(env_file, env_backup)
        print(f"✅ Backed up to {env_backup}")
    
    # Copy cloud config to .env
    print("☁️ Copying cloud configuration...")
    shutil.copy2(env_cloud, env_file)
    print(f"✅ Updated {env_file}")
    
    # Verify the switch
    print("\n🔍 Verifying configuration...")
    with open(env_file, 'r') as f:
        content = f.read()
        if "CLOUD_PROVIDER=cloud" in content:
            print("✅ Successfully switched to cloud configuration!")
            print("\n📋 Next steps:")
            print("1. Restart your backend server: python .\\run.py")
            print("2. Verify the switch in the Settings page")
            return True
        else:
            print("❌ Error: Configuration switch failed!")
            return False

if __name__ == "__main__":
    success = switch_to_cloud()
    if success:
        print("\n🎉 Backend environment switched to cloud!")
    else:
        print("\n💥 Failed to switch backend environment!")
