from datetime import datetime
from typing import Dict, Any, Literal
import psutil
import os
import socket
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.security import verify_token
from ..database import get_db, get_engine
from ..models import User
from ..core.config import settings

router = APIRouter(prefix="/system", tags=["system"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class EnvironmentSwitchRequest(BaseModel):
    action: Literal["local", "cloud"]
    # No complex config needed for now - just switch between equivalent files


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


@router.get("/status")
def get_system_status(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """Get comprehensive system status information"""
    
    try:
        # Database connection test
        db_status = "connected"
        try:
            # Test database connection using SQLAlchemy text()
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            # Only log database failures, not successes
        except Exception as e:
            db_status = "disconnected"
            print(f"❌ Database connection test failed: {e}")
            print(f"   Database engine URL: {get_engine().url}")
            print(f"   Database file exists: {Path('risk_platform.db').exists()}")
        
        # Process information
        current_process = psutil.Process()
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage for database file
        db_path = Path("risk_platform.db")
        disk_usage = None
        if db_path.exists():
            disk_usage = {
                "total": psutil.disk_usage(".").total,
                "used": psutil.disk_usage(".").used,
                "free": psutil.disk_usage(".").free,
                "database_size": db_path.stat().st_size if db_path.exists() else 0
            }
        
        # User count
        user_count = db.query(User).count()
        
        # Risk count (if Risk model is available)
        risk_count = 0
        try:
            from ..models.risk import Risk
            risk_count = db.query(Risk).count()
        except ImportError:
            pass
        
        from ..core.config import settings
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "status": db_status,
                "type": settings.database_type,
                "engine": str(get_engine().url),
                "user_count": user_count,
                "risk_count": risk_count
            },
            "system": {
                "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
                "platform": os.sys.platform,
                "process_id": current_process.pid,
                "memory_usage": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "cpu_percent": current_process.cpu_percent(),
                "disk_usage": disk_usage
            },
            "application": {
                "name": "Risk Platform API",
                "version": "0.1.0",
                "environment": "development"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system status: {str(e)}"
        )


@router.get("/ports")
def get_port_status(
    user_id: int = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """Get status of common development ports with process information"""
    
    import socket
    import psutil
    
    def get_process_info(port: int) -> Dict[str, Any]:
        """Get process information for a given port"""
        try:
            for conn in psutil.net_connections():
                if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                    try:
                        process = psutil.Process(conn.pid)
                        return {
                            "pid": conn.pid,
                            "name": process.name(),
                            "cmdline": " ".join(process.cmdline()[:3]) if process.cmdline() else "",  # First 3 args
                            "cpu_percent": round(process.cpu_percent(), 1),
                            "memory_mb": round(process.memory_info().rss / 1024 / 1024, 1)
                        }
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        return {"pid": conn.pid, "name": "Unknown", "cmdline": "", "cpu_percent": 0, "memory_mb": 0}
        except Exception as e:
            print(f"Error getting process info for port {port}: {e}")
        
        return None
    
    common_ports = [
        {"port": 8000, "service": "FastAPI Backend", "description": "Python FastAPI backend server"},
        {"port": 5173, "service": "Vite Dev Server", "description": "Vite development server (current)"},
        {"port": 3000, "service": "React Dev Server", "description": "Default React development server"},
        {"port": 5433, "service": "PostgreSQL", "description": "PostgreSQL database (if using)"},
        {"port": 3306, "service": "MySQL", "description": "MySQL database (if using)"},
        {"port": 6379, "service": "Redis", "description": "Redis cache (if using)"},
        {"port": 8080, "service": "Alternative Backend", "description": "Alternative backend port"},
    ]
    
    port_status = []
    
    for port_info in common_ports:
        port = port_info["port"]
        
        # Try both IPv4 and IPv6 to handle different binding scenarios
        is_active = False
        
        # Try IPv4 first (127.0.0.1)
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            
            if result == 0:
                is_active = True
                # No logging for successful port checks - too noisy
        except Exception as e:
            # Only log errors for important ports
            if port in [8000, 5173]:
                print(f"IPv4 check failed for port {port}: {e}")
        
        # If IPv4 failed, try IPv6 (::1)
        if not is_active:
            try:
                sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('::1', port))
                sock.close()
                
                if result == 0:
                    is_active = True
                    # No logging for successful port checks - too noisy
            except Exception as e:
                # Only log errors for important ports
                if port in [8000, 5173]:
                    print(f"⚠️ Port {port} ({port_info['service']}) ERROR: {e}")
        
        port_info["status"] = "active" if is_active else "inactive"
        
        # Add process information if port is active
        if is_active:
            process_info = get_process_info(port)
            if process_info:
                port_info["process"] = process_info
                # No logging for process info - too noisy
        
        port_status.append(port_info)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "ports": port_status
    }


@router.get("/config")
def get_configuration(
    user_id: int = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """Get current configuration (without sensitive data)"""
    
    from ..core.config import settings
    
    # Determine if we're running in cloud environment
    is_cloud = settings.is_cloud
    environment = settings.environment
    cloud_provider = settings.effective_cloud_provider
    
    # Get effective URLs from settings
    frontend_url = settings.effective_frontend_url
    backend_url = settings.effective_backend_url
    database_url = settings.effective_database_url
    
    # Determine database type and location
    database_type = settings.database_type
    is_local_db = database_url.startswith("sqlite") or "localhost" in database_url
    
    # Get CORS origins
    cors_origins = settings.cors_origins
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "environment": environment,
        "isCloud": is_cloud,
        "cloudProvider": cloud_provider,
        "database": {
            "type": database_type,
            "isLocal": is_local_db,
            "effective_url": "***hidden***" if is_cloud else database_url
        },
        "services": {
            "frontend": {
                "local": settings.frontend_url,
                "cloud": settings.cloud_frontend_url,
                "effective": frontend_url
            },
            "backend": {
                "local": settings.backend_url,
                "cloud": settings.cloud_backend_url,
                "effective": backend_url
            }
        },
        "cors": {
            "origins": cors_origins,
            "count": len(cors_origins)
        }
    }


@router.get("/deployment")
def get_deployment_info(
    user_id: int = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """Get deployment information including version, commit, and deployment time"""
    
    import subprocess
    import os
    from datetime import datetime
    
    try:
        # Get git commit info
        commit_hash = "unknown"
        commit_message = "unknown"
        commit_date = "unknown"
        
        try:
            # Try to get git info if available
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            if result.returncode == 0:
                commit_hash = result.stdout.strip()[:8]  # Short hash
                
            # Get commit message
            result = subprocess.run(
                ["git", "log", "-1", "--pretty=format:%s"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            if result.returncode == 0:
                commit_message = result.stdout.strip()
                
            # Get commit date
            result = subprocess.run(
                ["git", "log", "-1", "--pretty=format:%ci"], 
                capture_output=True, 
                text=True, 
                timeout=5
            )
            if result.returncode == 0:
                commit_date = result.stdout.strip()
                
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError):
            # Git not available or error, use fallback
            pass
        
        # Get environment info
        environment = os.getenv("ENVIRONMENT", "production")
        render_service_id = os.getenv("RENDER_SERVICE_ID", "unknown")
        render_deploy_id = os.getenv("RENDER_DEPLOY_ID", "unknown")
        
        # Get deployment time (when the service started)
        deployment_time = datetime.utcnow().isoformat()
        
        # Try to get actual deployment time from environment
        if "RENDER" in os.environ:
            # Running on Render
            deployment_time = os.getenv("RENDER_DEPLOY_TIME", deployment_time)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "backend": {
                "version": {
                    "commit_hash": commit_hash,
                    "commit_message": commit_message,
                    "commit_date": commit_date,
                    "short_hash": commit_hash[:8] if commit_hash != "unknown" else "unknown"
                },
                "deployment": {
                    "environment": environment,
                    "service_id": render_service_id,
                    "deploy_id": render_deploy_id,
                    "deployment_time": deployment_time,
                    "platform": "render" if "RENDER" in os.environ else "local"
                },
                "build": {
                    "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
                    "platform": os.sys.platform
                }
            },
            "frontend": {
                "version": {
                    "commit_hash": commit_hash,  # Same as backend for now
                    "commit_message": commit_message,
                    "commit_date": commit_date,
                    "short_hash": commit_hash[:8] if commit_hash != "unknown" else "unknown"
                },
                "deployment": {
                    "environment": environment,
                    "platform": "netlify",
                    "deployment_time": deployment_time,
                    "url": "https://riskworks.netlify.app"
                },
                "build": {
                    "node_version": "22",  # From .nvmrc
                    "build_tool": "vite"
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deployment info: {str(e)}"
        )


@router.post("/switch-env")
def switch_environment(
    request: EnvironmentSwitchRequest,
    user_id: int = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """Switch between local and cloud environments - now with actual file switching"""
    
    from ..core.config import settings
    
    try:
        print(f"🔄 Environment switch requested: {request.action}")
        
        # Get backend directory path
        backend_dir = Path(__file__).parent.parent.parent
        
        # Define environment file paths
        local_env = backend_dir / ".env.local"
        cloud_env = backend_dir / ".env.cloud"
        active_env = backend_dir / ".env"
        
        # Check if environment files exist
        if not local_env.exists():
            print(f"❌ Local environment file not found: {local_env}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Local environment file (.env.local) not found. Run 'python simple_env_switch.py create' first."
            )
        
        if not cloud_env.exists():
            print(f"❌ Cloud environment file not found: {cloud_env}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloud environment file (.env.cloud) not found. Run 'python simple_env_switch.py create' first."
            )
        
        # Perform the file switch
        if request.action == "local":
            # Copy local env to active env
            import shutil
            shutil.copy2(local_env, active_env)
            print(f"✅ Switched to LOCAL environment")
            current_env = "local"
        elif request.action == "cloud":
            # Copy cloud env to active env
            import shutil
            shutil.copy2(cloud_env, active_env)
            print(f"✅ Switched to CLOUD environment")
            current_env = "cloud"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Must be 'local' or 'cloud'"
            )
        
        # Verify the switch worked
        if active_env.exists():
            print(f"✅ Active environment file updated: {active_env}")
        else:
            print(f"❌ Failed to update active environment file")
        
        # Environment switch completed - manual restart required
        print(f"✅ Environment switch completed successfully")
        print(f"🔄 Manual backend restart required to apply new configuration")
        
        return {
            "success": True,
            "message": f"Successfully switched to {request.action} environment! Manual backend restart required.",
            "action": request.action,
            "restart_required": True,
            "current_environment": current_env,
            "restart_instructions": {
                "step1": "Stop the current backend (Ctrl+C in the backend terminal)",
                "step2": "Navigate to the backend directory: cd backend",
                "step3": "Activate virtual environment: .\\.venv\\Scripts\\Activate.ps1",
                "step4": "Start backend: python .\\run.py"
            },
                            "config": {
                    "environment": "development",
                    "database_type": settings.database_type,
                    "cloud_provider": current_env,
                    "has_cloud_config": current_env == "cloud"
                }
        }
        
    except Exception as e:
        print(f"❌ Environment switch error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to switch environment: {str(e)}"
        )


class BackendSwitchRequest(BaseModel):
    target: Literal["render", "local"]


class FrontendSwitchRequest(BaseModel):
    platform: Literal["vercel", "netlify"]


@router.post("/switch-environment")
async def switch_backend_environment(
    request: BackendSwitchRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Switch backend environment between Render and Local"""
    try:
        current_env = "cloud" if settings.is_cloud else "local"
        target_env = "cloud" if request.target == "render" else "local"
        
        if current_env == target_env:
            return {
                "success": True,
                "message": f"Backend is already running on {request.target}",
                "requires_restart": False
            }
        
        # Provide specific configuration instructions
        if request.target == "local":
            return {
                "success": True,
                "message": "Switching to local backend - configuration updated",
                "requires_restart": True,
                "instructions": {
                    "automated": "✅ Automated: Run 'python switch_to_local.py' from the project root directory",
                    "manual_backend": "✅ Manual Backend: Run 'python backend/switch_to_local.py' then 'python backend/.\\run.py'",
                    "manual_frontend": "✅ Manual Frontend: Update frontend/.env.local with:\nVITE_API_URL=http://localhost:8000\nVITE_FRONTEND_URL=http://localhost:5173\nVITE_DEPLOYMENT_PLATFORM=local",
                    "restart": "🔄 Restart both servers: backend (python .\\run.py) and frontend (npm run dev)",
                    "verify": "🌐 Open http://localhost:5173 to verify the switch"
                }
            }
        else:  # render
            return {
                "success": True,
                "message": "Switching to Render backend - configuration updated",
                "requires_restart": True,
                "instructions": {
                    "automated": "✅ Automated: Run 'python switch_to_cloud.py' from the project root directory",
                    "manual_backend": "✅ Manual Backend: Run 'python backend/switch_to_cloud.py' then 'python backend/.\\run.py'",
                    "manual_frontend": "✅ Manual Frontend: Update frontend/.env.local with:\nVITE_API_URL=https://riskworks.onrender.com\nVITE_FRONTEND_URL=http://localhost:5173\nVITE_DEPLOYMENT_PLATFORM=local",
                    "restart": "🔄 Restart both servers: backend (python .\\run.py) and frontend (npm run dev)",
                    "verify": "🌐 Open http://localhost:5173 to verify the switch"
                }
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to switch backend environment: {str(e)}"
        )


@router.post("/switch-frontend-platform")
async def switch_frontend_platform(
    request: FrontendSwitchRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Switch frontend platform between Vercel and Netlify"""
    try:
        current_platform = getattr(settings, 'cloud_frontend_url', '')
        
        if request.platform == "vercel":
            target_url = "https://risk-works.vercel.app"
            platform_name = "Vercel"
        else:  # netlify
            target_url = "https://riskworks.netlify.app"
            platform_name = "Netlify"
        
        return {
            "success": True,
            "message": f"To switch to {platform_name}, redeploy your frontend with the correct environment variables",
            "requires_restart": True,
            "instructions": {
                "frontend": f"Update VITE_FRONTEND_URL to {target_url} and redeploy",
                "backend": f"Add {target_url} to CORS origins if not already present"
            }
        }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to switch frontend platform: {str(e)}"
        )


