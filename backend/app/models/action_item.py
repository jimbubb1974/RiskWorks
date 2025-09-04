from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Action details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Action metadata
    action_type: Mapped[str] = mapped_column(String(50), nullable=False, default="mitigation")  # mitigation, contingency, monitoring
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    
    # Status tracking
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, in_progress, completed, cancelled
    
    # Assignment and ownership
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # Risk relationship
    risk_id: Mapped[int] = mapped_column(ForeignKey("risks.id"), nullable=False, index=True)
    
    # Dates
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Progress tracking
    progress_percentage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 0-100
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    risk = relationship("Risk")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<ActionItem(id={self.id}, title='{self.title}', status='{self.status}')>"
