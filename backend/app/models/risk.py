from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Risk(Base):
	__tablename__ = "risks"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	severity: Mapped[int] = mapped_column(Integer, nullable=False)
	probability: Mapped[int] = mapped_column(Integer, nullable=False)
	status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
	owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	owner = relationship("User", back_populates="risks")


