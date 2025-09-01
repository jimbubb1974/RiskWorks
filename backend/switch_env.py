#!/usr/bin/env python3
"""
Environment Configuration Switcher
Helps switch between local and cloud configurations
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any


class EnvironmentSwitcher:
    """Manage environment configuration switching"""
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.env_file = self.backend_dir / ".env"
        self.env_example = self.backend_dir / "env.example"
        
    def show_current_config(self) -> Dict[str, Any]:
        """Show current environment configuration"""
        if not self.env_file.exists():
            return {"status": "no_env_file", "message": "No .env file found"}
        
        config = {}
        with open(self.env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
        
        return {
            "status": "loaded",
            "environment": config.get("ENVIRONMENT", "development"),
            "database_type": config.get("DATABASE_TYPE", "sqlite"),
            "cloud_provider": config.get("CLOUD_PROVIDER", "local"),
            "has_cloud_urls": bool(config.get("CLOUD_DATABASE_URL") or config.get("CLOUD_BACKEND_URL"))
        }
    
    def switch_to_local(self):
        """Switch to local development configuration"""
        config = {
            "ENVIRONMENT": "development",
            "DATABASE_URL": "sqlite:///./risk_platform.db",
            "DATABASE_TYPE": "sqlite",
            "SECRET_KEY": "dev-secret-change-in-production",
            "ALGORITHM": "HS256",
            "ACCESS_TOKEN_EXPIRES_MINUTES": "1440",
            "FRONTEND_URL": "http://localhost:5173",
            "BACKEND_URL": "http://localhost:8000",
            "CLOUD_PROVIDER": "local",
            "CLOUD_DATABASE_URL": "",
            "CLOUD_FRONTEND_URL": "",
            "CLOUD_BACKEND_URL": ""
        }
        
        self._write_env_file(config)
        print("✅ Switched to LOCAL development configuration")
        print("   - Database: SQLite (risk_platform.db)")
        print("   - Frontend: http://localhost:5173")
        print("   - Backend: http://localhost:8000")
    
    def switch_to_railway(self):
        """Switch to Railway cloud configuration"""
        print("🚂 Switching to Railway configuration...")
        print("Please provide the following information:")
        
        db_url = input("PostgreSQL Database URL: ").strip()
        backend_url = input("Backend API URL: ").strip()
        frontend_url = input("Frontend URL (optional): ").strip()
        
        if not db_url or not backend_url:
            print("❌ Database and Backend URLs are required!")
            return
        
        config = {
            "ENVIRONMENT": "production",
            "DATABASE_URL": "sqlite:///./risk_platform.db",  # Fallback
            "DATABASE_TYPE": "postgresql",
            "SECRET_KEY": "your-super-secret-key-change-in-production",
            "ALGORITHM": "HS256",
            "ACCESS_TOKEN_EXPIRES_MINUTES": "1440",
            "FRONTEND_URL": "http://localhost:5173",  # Fallback
            "BACKEND_URL": "http://localhost:8000",   # Fallback
            "CLOUD_PROVIDER": "railway",
            "CLOUD_DATABASE_URL": db_url,
            "CLOUD_BACKEND_URL": backend_url,
            "CLOUD_FRONTEND_URL": frontend_url if frontend_url else ""
        }
        
        self._write_env_file(config)
        print("✅ Switched to RAILWAY configuration")
        print(f"   - Database: PostgreSQL (cloud)")
        print(f"   - Backend: {backend_url}")
        print(f"   - Frontend: {frontend_url if frontend_url else 'Not set'}")
    
    def switch_to_render(self):
        """Switch to Render cloud configuration"""
        print("🎨 Switching to Render configuration...")
        print("Please provide the following information:")
        
        db_url = input("PostgreSQL Database URL: ").strip()
        backend_url = input("Backend API URL: ").strip()
        frontend_url = input("Frontend URL (optional): ").strip()
        
        if not db_url or not backend_url:
            print("❌ Database and Backend URLs are required!")
            return
        
        config = {
            "ENVIRONMENT": "production",
            "DATABASE_URL": "sqlite:///./risk_platform.db",  # Fallback
            "DATABASE_TYPE": "postgresql",
            "SECRET_KEY": "your-super-secret-key-change-in-production",
            "ALGORITHM": "HS256",
            "ACCESS_TOKEN_EXPIRES_MINUTES": "1440",
            "FRONTEND_URL": "http://localhost:5173",  # Fallback
            "BACKEND_URL": "http://localhost:8000",   # Fallback
            "CLOUD_PROVIDER": "render",
            "CLOUD_DATABASE_URL": db_url,
            "CLOUD_BACKEND_URL": backend_url,
            "CLOUD_FRONTEND_URL": frontend_url if frontend_url else ""
        }
        
        self._write_env_file(config)
        print("✅ Switched to RENDER configuration")
        print(f"   - Database: PostgreSQL (cloud)")
        print(f"   - Backend: {backend_url}")
        print(f"   - Frontend: {frontend_url if frontend_url else 'Not set'}")
    
    def _write_env_file(self, config: Dict[str, str]):
        """Write configuration to .env file"""
        with open(self.env_file, 'w') as f:
            f.write("# Environment Configuration\n")
            f.write("# Generated by switch_env.py\n\n")
            
            for key, value in config.items():
                if value:  # Only write non-empty values
                    f.write(f"{key}={value}\n")
                else:
                    f.write(f"# {key}=\n")
    
    def create_env_from_example(self):
        """Create .env file from example if it doesn't exist"""
        if self.env_file.exists():
            print("ℹ️  .env file already exists")
            return
        
        if not self.env_example.exists():
            print("❌ env.example file not found")
            return
        
        shutil.copy(self.env_example, self.env_file)
        print("✅ Created .env file from env.example")
        print("   Please edit .env file with your configuration")
    
    def show_help(self):
        """Show help information"""
        print("🌍 Environment Configuration Switcher")
        print("=====================================")
        print()
        print("Commands:")
        print("  local     - Switch to local development (SQLite)")
        print("  railway   - Switch to Railway cloud deployment")
        print("  render    - Switch to Render cloud deployment")
        print("  status    - Show current configuration")
        print("  create    - Create .env file from example")
        print("  help      - Show this help message")
        print()
        print("Examples:")
        print("  python switch_env.py local")
        print("  python switch_env.py railway")
        print("  python switch_env.py status")


def main():
    """Main function"""
    import sys
    
    switcher = EnvironmentSwitcher()
    
    if len(sys.argv) < 2:
        switcher.show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "local":
        switcher.switch_to_local()
    elif command == "railway":
        switcher.switch_to_railway()
    elif command == "render":
        switcher.switch_to_render()
    elif command == "status":
        config = switcher.show_current_config()
        print("📊 Current Configuration:")
        print(f"   Status: {config['status']}")
        if config['status'] == 'loaded':
            print(f"   Environment: {config['environment']}")
            print(f"   Database: {config['database_type']}")
            print(f"   Cloud Provider: {config['cloud_provider']}")
            print(f"   Has Cloud URLs: {config['has_cloud_urls']}")
    elif command == "create":
        switcher.create_env_from_example()
    elif command == "help":
        switcher.show_help()
    else:
        print(f"❌ Unknown command: {command}")
        switcher.show_help()


if __name__ == "__main__":
    main()
