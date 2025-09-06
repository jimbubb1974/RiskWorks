from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Dict, Any
import os
from pathlib import Path

from ..core.security import verify_token
from ..core.config import settings

router = APIRouter(prefix="/config", tags=["config"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class ConfigUpdateRequest(BaseModel):
    target: str  # "frontend" or "backend"
    environment: str  # "local" or "cloud"
    platform: str  # "vercel", "netlify", "render", "local"


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id


@router.post("/update-frontend")
async def update_frontend_config(
    request: ConfigUpdateRequest,
    fastapi_request: Request,
    authorization: str | None = Header(default=None)
):
    """Update frontend configuration files"""
    try:
        # Auth: allow bearer auth if provided; otherwise allow local loopback in development
        try:
            if authorization:
                token = authorization.split(" ")[-1]
                _ = verify_token(token)
            else:
                client_host = fastapi_request.client.host if fastapi_request.client else ""
                if settings.is_cloud or client_host not in ("127.0.0.1", "::1", "localhost"):
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

        # Determine the configuration based on environment and platform
        if request.environment == "local":
            config_content = f"""VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local"""
        else:  # cloud
            if request.platform == "vercel":
                config_content = f"""VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://risk-works.vercel.app
VITE_DEPLOYMENT_PLATFORM=vercel"""
            else:  # netlify
                config_content = f"""VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.netlify.app
VITE_DEPLOYMENT_PLATFORM=netlify"""

        # Decide target file path (use .env.local so it affects local dev immediately)
        file_path = "frontend/.env.local"

        # Attempt to write the file when running locally
        wrote = False
        wrote_path = None
        error = None
        try:
            project_root = Path(__file__).resolve().parents[3]
            target = project_root / file_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(config_content, encoding="utf-8")
            wrote = True
            wrote_path = str(target)
        except Exception as e:
            error = str(e)

        return {
            "success": True,
            "message": f"Frontend configuration updated for {request.platform}",
            "config_content": config_content,
            "file_path": file_path,
            "wrote": wrote,
            "wrote_path": wrote_path,
            "write_error": error,
            "instructions": {
                "restart": "Restart your frontend dev server: cd frontend && npm run dev",
                "verify": "Open http://localhost:5173 and verify"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate frontend configuration: {str(e)}"
        )


@router.post("/update-backend")
async def update_backend_config(
    request: ConfigUpdateRequest,
    user_id: int = Depends(get_current_user_id)
):
    """Update backend configuration files"""
    try:
        if request.environment == "local":
            config_content = f"""DATABASE_URL=sqlite:///./riskworks.db
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
IS_CLOUD=false"""
        else:  # cloud
            config_content = f"""DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production
IS_CLOUD=true
CLOUD_PROVIDER=render"""

        return {
            "success": True,
            "message": f"Backend configuration generated for {request.platform}",
            "config_content": config_content,
            "file_path": "backend/.env",
            "instructions": {
                "create_file": "Create backend/.env with the provided content",
                "restart": "Restart your backend server",
                "verify": "Check that the backend API responds correctly"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate backend configuration: {str(e)}"
        )


@router.get("/templates")
async def get_config_templates(user_id: int = Depends(get_current_user_id)):
    """Get configuration templates for different environments"""
    return {
        "frontend": {
            "local": {
                "file": "frontend/.env.local",
                "content": """VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEPLOYMENT_PLATFORM=local"""
            },
            "vercel": {
                "file": "frontend/.env.production",
                "content": """VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://risk-works.vercel.app
VITE_DEPLOYMENT_PLATFORM=vercel"""
            },
            "netlify": {
                "file": "frontend/.env.production", 
                "content": """VITE_API_URL=https://riskworks.onrender.com
VITE_FRONTEND_URL=https://riskworks.netlify.app
VITE_DEPLOYMENT_PLATFORM=netlify"""
            }
        },
        "backend": {
            "local": {
                "file": "backend/.env",
                "content": """DATABASE_URL=sqlite:///./riskworks.db
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
IS_CLOUD=false"""
            },
            "render": {
                "file": "backend/.env",
                "content": """DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-here
ENVIRONMENT=production
IS_CLOUD=true
CLOUD_PROVIDER=render"""
            }
        }
    }
