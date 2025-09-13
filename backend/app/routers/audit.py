from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db
from ..schemas.audit import AuditLogRead, AuditLogFilter, RiskTrendDataPoint
from ..services.audit import (
    get_audit_logs, 
    get_risk_audit_trail, 
    get_action_item_audit_trail,
    get_risk_trend_data
)
from ..services.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["audit"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


@router.get("/logs", response_model=List[AuditLogRead])
def get_audit_logs_endpoint(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    limit: int = Query(100, ge=1, le=1000, description="Number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip")
):
    """Get audit logs with optional filtering"""
    
    # Get current user to check permissions
    user = get_current_user(db, current_user_id)
    
    # Only managers and admins can view audit logs
    if user.role not in ["manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view audit logs"
        )
    
    logs = get_audit_logs(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        action=action,
        limit=limit,
        offset=offset
    )
    
    # Convert to response format with user email
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_id": log.user_id,
            "action": log.action,
            "changes": log.changes,
            "description": log.description,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "user_email": log.user.email if log.user else None
        }
        result.append(AuditLogRead(**log_dict))
    
    return result


@router.get("/risks/{risk_id}/trail", response_model=List[AuditLogRead])
def get_risk_audit_trail_endpoint(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=500, description="Number of logs to return")
):
    """Get audit trail for a specific risk"""
    
    # Get current user to check permissions
    user = get_current_user(db, current_user_id)
    
    # Check if user can access this risk
    from ..services.risk import get_risk
    risk = get_risk(db, user.id, risk_id, user.role)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found or access denied"
        )
    
    logs = get_risk_audit_trail(db, risk_id, limit)
    
    # Convert to response format
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_id": log.user_id,
            "action": log.action,
            "changes": log.changes,
            "description": log.description,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "user_email": log.user.email if log.user else None
        }
        result.append(AuditLogRead(**log_dict))
    
    return result


@router.get("/action-items/{action_item_id}/trail", response_model=List[AuditLogRead])
def get_action_item_audit_trail_endpoint(
    action_item_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=500, description="Number of logs to return")
):
    """Get audit trail for a specific action item"""
    
    # Get current user to check permissions
    user = get_current_user(db, current_user_id)
    
    # Check if user can access this action item
    from ..models.action_item import ActionItem
    action_item = db.get(ActionItem, action_item_id)
    if not action_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )
    
    # Check if user can access the associated risk
    from ..services.risk import get_risk
    risk = get_risk(db, user.id, action_item.risk_id, user.role)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this action item"
        )
    
    logs = get_action_item_audit_trail(db, action_item_id, limit)
    
    # Convert to response format
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "user_id": log.user_id,
            "action": log.action,
            "changes": log.changes,
            "description": log.description,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "timestamp": log.timestamp,
            "user_email": log.user.email if log.user else None
        }
        result.append(AuditLogRead(**log_dict))
    
    return result


@router.get("/risks/{risk_id}/trend", response_model=List[RiskTrendDataPoint])
def get_risk_trend_endpoint(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back")
):
    """Get risk trend data for probability, impact, and score over time"""
    
    # Get current user to check permissions
    user = get_current_user(db, current_user_id)
    
    # Check if user can access this risk
    from ..services.risk import get_risk
    risk = get_risk(db, user.id, risk_id, user.role)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk not found or access denied"
        )
    
    trend_data = get_risk_trend_data(db, risk_id, days)
    return [RiskTrendDataPoint(**point) for point in trend_data]