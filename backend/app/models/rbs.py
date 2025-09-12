from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class RBSNode(Base):
    __tablename__ = "rbs_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("rbs_nodes.id", ondelete="CASCADE"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    parent: Mapped[Optional["RBSNode"]] = relationship(
        "RBSNode", remote_side="RBSNode.id", back_populates="children", passive_deletes=True
    )
    children: Mapped[List["RBSNode"]] = relationship(
        "RBSNode", back_populates="parent", cascade="all, delete-orphan", order_by="RBSNode.order_index"
    )


