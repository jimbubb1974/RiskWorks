from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base
from sqlalchemy.orm import relationship


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
	# Temporary field for development - stores plain text password
	plain_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
	
	# User role (determines permissions)
	role: Mapped[str] = mapped_column(String(50), nullable=False, default="viewer")
	
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

	risks = relationship("Risk", back_populates="owner", foreign_keys="[Risk.owner_id]", cascade="all, delete-orphan")
	snapshots = relationship("Snapshot", back_populates="creator", cascade="all, delete-orphan")


