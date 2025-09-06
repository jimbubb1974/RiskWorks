#!/usr/bin/env python3
"""
Switch both frontend and backend to local configuration
"""

import shutil
import os
from pathlib import Path

def switch_to_local():
    """Switch both frontend and backend to local configuration"""
    project_root = Path(__file__).parent
    
    print("Switching to local development environment...")
    print("=" * 50)
    
    # Switch backend
    print("\nSwitching backend to local...")
    backend_dir = project_root / "backend"
    env_file = backend_dir / ".env"
    env_local = backend_dir / ".env.local"
    env_backup = backend_dir / ".env.backup"
    
    if not env_local.exists():
        print("❌ Error: backend/.env.local file not found!")
        return False
    
    # Backup current .env file
    if env_file.exists():
        shutil.copy2(env_file, env_backup)
        print(f"Backed up backend/.env to backend/.env.backup")
    
    # Copy local config to .env
    shutil.copy2(env_local, env_file)
    print(f"Updated backend/.env with local configuration")
    
    # Switch frontend
    print("\nSwitching frontend to local...")
    frontend_dir = project_root / "frontend"
    frontend_env = frontend_dir / ".env.local"
    
    # Create frontend local config
    frontend_config = """VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local"""
    
    with open(frontend_env, 'w') as f:
        f.write(frontend_config)
    print(f"Updated frontend/.env.local with local configuration")
    
    # Verify the switch
    print("\nVerifying configuration...")
    
    # Check backend
    with open(env_file, 'r') as f:
        backend_content = f.read()
        if "CLOUD_PROVIDER=local" in backend_content:
            print("Backend: Successfully switched to local configuration.")
        else:
            print("Backend: Configuration switch failed.")
            return False
    
    # Check frontend
    with open(frontend_env, 'r') as f:
        frontend_content = f.read()
        if "VITE_API_URL=http://localhost:8000" in frontend_content:
            print("Frontend: Successfully switched to local configuration.")
        else:
            print("Frontend: Configuration switch failed.")
            return False
    
    print("\nNext steps:")
    print("1. Restart your backend server: cd backend && python .\\run.py")
    print("2. Restart your frontend server: cd frontend && npm run dev")
    print("3. Open http://localhost:5173 to verify the switch")
    
    return True

if __name__ == "__main__":
    success = switch_to_local()
    if success:
        print("\nSuccessfully switched to local development environment.")
    else:
        print("\nFailed to switch to local development environment.")