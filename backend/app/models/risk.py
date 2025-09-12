from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Risk(Base):
	__tablename__ = "risks"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	risk_name: Mapped[str] = mapped_column(String(255), nullable=False)
	risk_description: Mapped[str | None] = mapped_column(Text, nullable=True)
	
	# Risk Assessment (1-5 scale)
	probability: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
	impact: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
	
	# Risk details
	category: Mapped[str] = mapped_column(String(50), nullable=True, default="operational")
	risk_owner: Mapped[str] = mapped_column(String(100), nullable=True, default="Unassigned")
	latest_reviewed_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
	probability_basis: Mapped[str | None] = mapped_column(Text, nullable=True)
	impact_basis: Mapped[str | None] = mapped_column(Text, nullable=True)
	notes: Mapped[str | None] = mapped_column(Text, nullable=True)
	
	# Status and ownership
	status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
	owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	
	# Timestamps
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
	

	owner = relationship("User", back_populates="risks", foreign_keys=[owner_id])

	@property
	def score(self) -> int:
		# Risk Score = Probability × Impact
		return int(self.probability) * int(self.impact)

	@property
	def risk_level(self) -> str:
		score = self.score
		if score <= 4:
			return "Low"
		elif score <= 8:
			return "Medium"
		elif score <= 15:
			return "High"
		else:
			return "Critical"


