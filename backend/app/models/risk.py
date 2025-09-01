from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Risk(Base):
	__tablename__ = "risks"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	title: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str | None] = mapped_column(Text, nullable=True)
	
	# Risk Assessment
	likelihood: Mapped[int] = mapped_column(Integer, nullable=False, default=3)  # 1-5 scale
	impact: Mapped[int] = mapped_column(Integer, nullable=False, default=3)    # 1-5 scale
	
	# Legacy fields for backward compatibility
	severity: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
	probability: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
	
	# Enhanced fields
	category: Mapped[str] = mapped_column(String(50), nullable=True, default="operational")
	risk_owner: Mapped[str] = mapped_column(String(100), nullable=True, default="Unassigned")
	department: Mapped[str] = mapped_column(String(100), nullable=True, default="General")
	location: Mapped[str] = mapped_column(String(100), nullable=True, default="Unspecified")
	
	# Risk details
	root_cause: Mapped[str | None] = mapped_column(Text, nullable=True)
	mitigation_strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
	contingency_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
	
	# Dates
	target_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
	review_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
	
	# Status and ownership
	status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
	owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
	
	# Timestamps
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
	updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	owner = relationship("User", back_populates="risks", foreign_keys=[owner_id])
	assigned_user = relationship("User", foreign_keys=[assigned_to], back_populates=None)

	@property
	def score(self) -> int:
		# Use likelihood and impact for new scoring, fallback to legacy fields
		if hasattr(self, 'likelihood') and hasattr(self, 'impact'):
			return int(self.likelihood) * int(self.impact)
		return int(self.severity) * int(self.probability)

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


