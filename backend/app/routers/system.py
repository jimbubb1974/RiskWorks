from datetime import datetime
from typing import Dict, Any
import psutil
import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db, engine
from ..models import User

router = APIRouter(prefix="/system", tags=["system"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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
            # Test database connection
            db.execute("SELECT 1")
        except Exception:
            db_status = "disconnected"
        
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
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "status": db_status,
                "engine": str(engine.url),
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
    """Get status of common development ports"""
    
    import socket
    
    common_ports = [
        {"port": 3000, "service": "React Dev Server", "description": "Default React development server"},
        {"port": 5173, "service": "Vite Dev Server", "description": "Vite development server (current)"},
        {"port": 8000, "service": "FastAPI Backend", "description": "Python FastAPI backend server"},
        {"port": 5432, "service": "PostgreSQL", "description": "PostgreSQL database (if using)"},
        {"port": 3306, "service": "MySQL", "description": "MySQL database (if using)"},
        {"port": 6379, "service": "Redis", "description": "Redis cache (if using)"},
        {"port": 8080, "service": "Alternative Backend", "description": "Alternative backend port"},
    ]
    
    port_status = []
    
    for port_info in common_ports:
        port = port_info["port"]
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        
        try:
            result = sock.connect_ex(('localhost', port))
            if result == 0:
                port_info["status"] = "active"
            else:
                port_info["status"] = "inactive"
        except Exception:
            port_info["status"] = "error"
        finally:
            sock.close()
        
        port_status.append(port_info)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "ports": port_status
    }
