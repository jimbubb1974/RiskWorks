from datetime import datetime
from typing import Dict, Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Snapshot data stored as JSON
    risk_data: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    action_items_data: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # Relationship
    creator = relationship("User", back_populates="snapshots")

    @property
    def risk_count(self) -> int:
        """Get the number of risks in this snapshot"""
        if isinstance(self.risk_data, dict) and 'risks' in self.risk_data:
            return len(self.risk_data['risks'])
        return 0

    @property
    def action_items_count(self) -> int:
        """Get the number of action items in this snapshot"""
        if isinstance(self.action_items_data, dict) and 'action_items' in self.action_items_data:
            return len(self.action_items_data['action_items'])
        return 0
