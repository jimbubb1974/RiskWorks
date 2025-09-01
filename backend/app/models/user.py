from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base
from sqlalchemy.orm import relationship


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	risks = relationship("Risk", back_populates="owner", cascade="all, delete-orphan")


