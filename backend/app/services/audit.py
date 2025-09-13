from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.audit_log import AuditLog
from ..models.risk import Risk
from ..models.action_item import ActionItem


def log_audit_event(
    db: Session,
    entity_type: str,
    entity_id: int,
    user_id: int,
    action: str,
    changes: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """Log an audit event to the database"""
    
    audit_log = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        action=action,
        changes=changes or {},
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log


def get_risk_changes(old_risk: Risk, new_risk: Risk) -> Dict[str, Any]:
    """Extract changes between old and new risk objects"""
    changes = {}
    
    # Track all relevant fields
    fields_to_track = [
        'risk_name', 'risk_description', 'probability', 'impact', 'scope',
        'risk_owner', 'rbs_node_id', 'latest_reviewed_date', 'probability_basis',
        'impact_basis', 'notes', 'status'
    ]
    
    for field in fields_to_track:
        old_value = getattr(old_risk, field, None)
        new_value = getattr(new_risk, field, None)
        
        # Handle datetime comparison
        if isinstance(old_value, datetime) and isinstance(new_value, datetime):
            old_value = old_value.isoformat()
            new_value = new_value.isoformat()
        elif isinstance(old_value, datetime):
            old_value = old_value.isoformat()
        elif isinstance(new_value, datetime):
            new_value = new_value.isoformat()
        
        if old_value != new_value:
            changes[field] = {
                'old': old_value,
                'new': new_value
            }
    
    # Calculate score changes
    old_score = old_risk.score
    new_score = new_risk.score
    if old_score != new_score:
        changes['score'] = {
            'old': old_score,
            'new': new_score
        }
    
    # Calculate risk level changes
    old_level = old_risk.risk_level
    new_level = new_risk.risk_level
    if old_level != new_level:
        changes['risk_level'] = {
            'old': old_level,
            'new': new_level
        }
    
    return changes


def get_action_item_changes(old_item: ActionItem, new_item: ActionItem) -> Dict[str, Any]:
    """Extract changes between old and new action item objects"""
    changes = {}
    
    fields_to_track = [
        'title', 'description', 'action_type', 'priority', 'status',
        'assigned_to', 'due_date', 'completed_date', 'progress_percentage'
    ]
    
    for field in fields_to_track:
        old_value = getattr(old_item, field, None)
        new_value = getattr(new_item, field, None)
        
        # Handle datetime comparison
        if isinstance(old_value, datetime) and isinstance(new_value, datetime):
            old_value = old_value.isoformat()
            new_value = new_value.isoformat()
        elif isinstance(old_value, datetime):
            old_value = old_value.isoformat()
        elif isinstance(new_value, datetime):
            new_value = new_value.isoformat()
        
        if old_value != new_value:
            changes[field] = {
                'old': old_value,
                'new': new_value
            }
    
    return changes


def get_audit_logs(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """Get audit logs with optional filtering"""
    
    from ..models.user import User
    
    query = db.query(AuditLog).join(User, AuditLog.user_id == User.id)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.order_by(desc(AuditLog.timestamp)).limit(limit).offset(offset).all()


def get_risk_audit_trail(db: Session, risk_id: int, limit: int = 50) -> List[AuditLog]:
    """Get audit trail for a specific risk"""
    from ..models.user import User
    
    query = db.query(AuditLog).join(User, AuditLog.user_id == User.id)
    return query.filter(
        AuditLog.entity_type == 'risk',
        AuditLog.entity_id == risk_id
    ).order_by(desc(AuditLog.timestamp)).limit(limit).all()


def get_action_item_audit_trail(db: Session, action_item_id: int, limit: int = 50) -> List[AuditLog]:
    """Get audit trail for a specific action item"""
    from ..models.user import User
    
    query = db.query(AuditLog).join(User, AuditLog.user_id == User.id)
    return query.filter(
        AuditLog.entity_type == 'action_item',
        AuditLog.entity_id == action_item_id
    ).order_by(desc(AuditLog.timestamp)).limit(limit).all()


def get_risk_trend_data(db: Session, risk_id: int, days: int = 30) -> List[Dict[str, Any]]:
    """Get risk trend data for probability, impact, and score over time"""
    from sqlalchemy import and_
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    logs = db.query(AuditLog).filter(
        and_(
            AuditLog.entity_type == 'risk',
            AuditLog.entity_id == risk_id,
            AuditLog.timestamp >= cutoff_date,
            AuditLog.action == 'update'
        )
    ).order_by(AuditLog.timestamp).all()
    
    trend_data = []
    for log in logs:
        if 'changes' in log.changes:
            changes = log.changes['changes']
            data_point = {
                'timestamp': log.timestamp.isoformat(),
                'user_id': log.user_id,
                'probability': None,
                'impact': None,
                'score': None,
                'risk_level': None
            }
            
            # Extract relevant fields
            if 'probability' in changes:
                data_point['probability'] = changes['probability']['new']
            if 'impact' in changes:
                data_point['impact'] = changes['impact']['new']
            if 'score' in changes:
                data_point['score'] = changes['score']['new']
            if 'risk_level' in changes:
                data_point['risk_level'] = changes['risk_level']['new']
            
            # Only include if we have relevant data
            if any(data_point[key] is not None for key in ['probability', 'impact', 'score', 'risk_level']):
                trend_data.append(data_point)
    
    return trend_data
