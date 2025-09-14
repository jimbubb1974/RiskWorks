from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.action_item import ActionItem
from ..schemas.action_item import ActionItemCreate, ActionItemUpdate


class ActionItemService:
    def __init__(self, db: Session):
        self.db = db

    def get_action_items(
        self,
        risk_id: Optional[int] = None,
        status: Optional[str] = None,
        assigned_to: Optional[int] = None
    ) -> List[ActionItem]:
        """Get action items with optional filtering"""
        query = self.db.query(ActionItem)
        
        if risk_id:
            query = query.filter(ActionItem.risk_id == risk_id)
        
        if status:
            query = query.filter(ActionItem.status == status)
            
        if assigned_to:
            query = query.filter(ActionItem.assigned_to == assigned_to)
            
        return query.order_by(ActionItem.created_at.desc()).all()

    def get_action_item(self, action_item_id: int) -> Optional[ActionItem]:
        """Get a specific action item by ID"""
        return self.db.query(ActionItem).filter(ActionItem.id == action_item_id).first()

    def create_action_item(self, action_item: ActionItemCreate, created_by: int) -> ActionItem:
        """Create a new action item"""
        db_action_item = ActionItem(
            **action_item.model_dump(),
            created_by=created_by,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Set completed_date if status is completed
        if action_item.status == "completed":
            db_action_item.completed_date = datetime.now(timezone.utc)
            
        self.db.add(db_action_item)
        self.db.commit()
        self.db.refresh(db_action_item)
        
        # Log the creation
        from .audit import log_audit_event
        log_audit_event(
            db=self.db,
            entity_type="action_item",
            entity_id=db_action_item.id,
            user_id=created_by,
            action="create",
            description=f"Action item '{db_action_item.title}' created"
        )
        
        return db_action_item

    def update_action_item(self, action_item_id: int, action_item_update: ActionItemUpdate, updated_by: int) -> Optional[ActionItem]:
        """Update an existing action item"""
        db_action_item = self.get_action_item(action_item_id)
        if not db_action_item:
            return None
        
        # Store the old state for audit logging
        old_item = ActionItem(
            title=db_action_item.title,
            description=db_action_item.description,
            action_type=db_action_item.action_type,
            priority=db_action_item.priority,
            status=db_action_item.status,
            assigned_to=db_action_item.assigned_to,
            due_date=db_action_item.due_date,
            completed_date=db_action_item.completed_date,
            progress_percentage=db_action_item.progress_percentage
        )
            
        update_data = action_item_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Handle status changes
        if "status" in update_data:
            if update_data["status"] == "completed" and not db_action_item.completed_date:
                update_data["completed_date"] = datetime.now(timezone.utc)
            elif update_data["status"] != "completed":
                update_data["completed_date"] = None
                
        # Handle progress percentage
        if "progress_percentage" in update_data:
            if update_data["progress_percentage"] == 100 and update_data.get("status") != "completed":
                update_data["status"] = "completed"
                update_data["completed_date"] = datetime.now(timezone.utc)
        
        for field, value in update_data.items():
            setattr(db_action_item, field, value)
            
        self.db.commit()
        self.db.refresh(db_action_item)
        
        # Log the changes
        from .audit import log_audit_event, get_action_item_changes
        changes = get_action_item_changes(old_item, db_action_item)
        if changes:
            log_audit_event(
                db=self.db,
                entity_type="action_item",
                entity_id=db_action_item.id,
                user_id=updated_by,
                action="update",
                changes=changes,
                description=f"Action item '{db_action_item.title}' updated"
            )
        
        return db_action_item

    def delete_action_item(self, action_item_id: int, deleted_by: int) -> bool:
        """Delete an action item"""
        db_action_item = self.get_action_item(action_item_id)
        if not db_action_item:
            return False
        
        # Log the deletion before deleting
        from .audit import log_audit_event
        log_audit_event(
            db=self.db,
            entity_type="action_item",
            entity_id=db_action_item.id,
            user_id=deleted_by,
            action="delete",
            description=f"Action item '{db_action_item.title}' deleted"
        )
            
        self.db.delete(db_action_item)
        self.db.commit()
        return True

    def update_status(self, action_item_id: int, status: str, progress_percentage: Optional[int] = None) -> Optional[ActionItem]:
        """Update action item status and progress"""
        db_action_item = self.get_action_item(action_item_id)
        if not db_action_item:
            return None
            
        db_action_item.status = status
        db_action_item.updated_at = datetime.now(timezone.utc)
        
        if progress_percentage is not None:
            db_action_item.progress_percentage = progress_percentage
            
        # Handle completion
        if status == "completed":
            db_action_item.completed_date = datetime.now(timezone.utc)
            db_action_item.progress_percentage = 100
        elif status != "completed":
            db_action_item.completed_date = None
            
        self.db.commit()
        self.db.refresh(db_action_item)
        return db_action_item

    def get_action_items_by_risk(self, risk_id: int) -> List[ActionItem]:
        """Get all action items for a specific risk"""
        return self.db.query(ActionItem).filter(ActionItem.risk_id == risk_id).order_by(ActionItem.created_at.desc()).all()

    def get_overdue_action_items(self) -> List[ActionItem]:
        """Get action items that are overdue"""
        now = datetime.now(timezone.utc)
        return self.db.query(ActionItem).filter(
            and_(
                ActionItem.due_date < now,
                ActionItem.status.in_(["pending", "in_progress"])
            )
        ).all()
