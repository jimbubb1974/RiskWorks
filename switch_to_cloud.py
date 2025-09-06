#!/usr/bin/env python3
"""
Switch both frontend and backend to cloud configuration
"""

import shutil
import os
from pathlib import Path

def switch_to_cloud():
    """Switch both frontend and backend to cloud configuration"""
    project_root = Path(__file__).parent
    
    print("🔄 Switching to cloud development environment...")
    print("=" * 50)
    
    # Switch backend
    print("\n☁️ Switching backend to cloud...")
    backend_dir = project_root / "backend"
    env_file = backend_dir / ".env"
    env_cloud = backend_dir / ".env.cloud"
    env_backup = backend_dir / ".env.backup"
    
    if not env_cloud.exists():
        print("❌ Error: backend/.env.cloud file not found!")
        return False
    
    # Backup current .env file
    if env_file.exists():
        shutil.copy2(env_file, env_backup)
        print(f"✅ Backed up backend/.env to backend/.env.backup")
    
    # Copy cloud config to .env
    shutil.copy2(env_cloud, env_file)
    print(f"✅ Updated backend/.env with cloud configuration")
    
    # Switch frontend
    print("\n🌐 Switching frontend to cloud...")
    frontend_dir = project_root / "frontend"
    frontend_env = frontend_dir / ".env.local"
    
    # Create frontend cloud config
    frontend_config = """VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local"""
    
    with open(frontend_env, 'w') as f:
        f.write(frontend_config)
    print(f"✅ Updated frontend/.env.local with cloud configuration")
    
    # Verify the switch
    print("\n🔍 Verifying configuration...")
    
    # Check backend
    with open(env_file, 'r') as f:
        backend_content = f.read()
        if "CLOUD_PROVIDER=cloud" in backend_content:
            print("✅ Backend: Successfully switched to cloud configuration!")
        else:
            print("❌ Backend: Configuration switch failed!")
            return False
    
    # Check frontend
    with open(frontend_env, 'r') as f:
        frontend_content = f.read()
        if "VITE_API_URL=https://riskworks.onrender.com" in frontend_content:
            print("✅ Frontend: Successfully switched to cloud configuration!")
        else:
            print("❌ Frontend: Configuration switch failed!")
            return False
    
    print("\n📋 Next steps:")
    print("1. Restart your backend server: cd backend && python .\\run.py")
    print("2. Restart your frontend server: cd frontend && npm run dev")
    print("3. Open http://localhost:5173 to verify the switch")
    
    return True

if __name__ == "__main__":
    success = switch_to_cloud()
    if success:
        print("\n🎉 Successfully switched to cloud development environment!")
    else:
        print("\n💥 Failed to switch to cloud development environment!")
