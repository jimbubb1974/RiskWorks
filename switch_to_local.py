#!/usr/bin/env python3
"""
Script to switch RiskWorks from cloud to local development
"""

import os
import shutil
from pathlib import Path

def main():
    print("🔄 Switching RiskWorks to local development...")
    
    # Get project root
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # 1. Switch backend to local environment
    print("\n1. Switching backend to local environment...")
    try:
        # Run the environment switch script
        import subprocess
        result = subprocess.run(
            ["python", "simple_env_switch.py", "local"],
            cwd=backend_dir,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ Backend switched to local environment")
        else:
            print(f"⚠️  Backend switch warning: {result.stderr}")
    except Exception as e:
        print(f"❌ Backend switch failed: {e}")
    
    # 2. Create local frontend .env file
    print("\n2. Creating local frontend environment...")
    frontend_env = frontend_dir / ".env.local"
    with open(frontend_env, "w") as f:
        f.write("VITE_API_URL=http://localhost:8000\n")
    print("✅ Created frontend/.env.local")
    
    # 3. Instructions for running locally
    print("\n3. Local development setup complete!")
    print("\n📋 To run locally:")
    print("   Backend:")
    print("   - cd backend")
    print("   - python run.py")
    print("   - Backend will run on http://localhost:8000")
    print("\n   Frontend:")
    print("   - cd frontend")
    print("   - npm install")
    print("   - npm run dev")
    print("   - Frontend will run on http://localhost:5173")
    print("\n   Database:")
    print("   - Backend will use local SQLite database")
    print("   - No cloud database connection needed")
    
    print("\n✅ Ready for local development!")

if __name__ == "__main__":
    main()
