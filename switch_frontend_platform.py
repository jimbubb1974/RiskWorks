#!/usr/bin/env python3
"""
Script to switch frontend deployment platform
"""

import os
import shutil
from pathlib import Path

def main():
    print("🔄 Frontend Platform Switcher")
    print("Available platforms:")
    print("1. netlify")
    print("2. vercel") 
    print("3. local")
    
    choice = input("\nEnter platform (1-3): ").strip()
    
    platform_map = {
        "1": "netlify",
        "2": "vercel", 
        "3": "local"
    }
    
    if choice not in platform_map:
        print("❌ Invalid choice")
        return
    
    platform = platform_map[choice]
    frontend_dir = Path("frontend")
    
    # Create environment file based on platform
    env_content = {
        "netlify": """VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.netlify.app
VITE_DEPLOYMENT_PLATFORM=netlify""",
        
        "vercel": """VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.vercel.app
VITE_DEPLOYMENT_PLATFORM=vercel""",
        
        "local": """VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local"""
    }
    
    # Write the environment file
    env_file = frontend_dir / ".env"
    with open(env_file, "w") as f:
        f.write(env_content[platform])
    
    print(f"✅ Switched to {platform}")
    print(f"📁 Created {env_file}")
    
    if platform == "local":
        print("\n🚀 To run locally:")
        print("cd frontend")
        print("npm run dev")
    else:
        print(f"\n🚀 To deploy to {platform}:")
        print("cd frontend")
        print("npm run build")
        print(f"Then deploy the 'dist' folder to {platform}")

if __name__ == "__main__":
    main()
