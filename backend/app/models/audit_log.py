from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Dict, Any, Optional

from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # What was changed
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'risk', 'action_item', 'user', etc.
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    # Who made the change
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # What action was performed
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # 'create', 'update', 'delete', 'status_change'
    
    # What changed (JSON field for flexible data)
    changes: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    
    # Additional context
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv6 compatible
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # When it happened
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<AuditLog(id={self.id}, entity_type='{self.entity_type}', entity_id={self.entity_id}, action='{self.action}')>"
