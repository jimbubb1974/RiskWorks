from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


Status = Literal["open", "in_progress", "mitigated", "closed", "escalated"]
Category = Literal["operational", "financial", "strategic", "technical", "compliance", "security", "environmental", "reputational"]


class RiskBase(BaseModel):
	title: str = Field(min_length=1, max_length=255)
	description: Optional[str] = None
	
	# Risk Assessment
	likelihood: int = Field(ge=1, le=5, description="Likelihood of risk occurring (1-5 scale)", default=3)
	impact: int = Field(ge=1, le=5, description="Impact if risk occurs (1-5 scale)", default=3)
	
	# Legacy fields for backward compatibility
	severity: Optional[int] = Field(default=None, ge=1, le=5)
	probability: Optional[int] = Field(default=None, ge=1, le=5)
	
	# Enhanced fields
	category: Optional[Category] = Field(default="operational")
	risk_owner: Optional[str] = Field(default="Unassigned", max_length=100)
	department: Optional[str] = Field(default="General", max_length=100)
	location: Optional[str] = Field(default="Unspecified", max_length=100)
	
	# Risk details
	root_cause: Optional[str] = None
	mitigation_strategy: Optional[str] = None
	contingency_plan: Optional[str] = None
	
	# Dates
	target_date: Optional[datetime] = None
	review_date: Optional[datetime] = None
	
	# Status and ownership
	status: Status = "open"
	assigned_to: Optional[int] = None


class RiskCreate(RiskBase):
	pass


class RiskUpdate(BaseModel):
	title: Optional[str] = Field(default=None, min_length=1, max_length=255)
	description: Optional[str] = None
	likelihood: Optional[int] = Field(default=None, ge=1, le=5)
	impact: Optional[int] = Field(default=None, ge=1, le=5)
	severity: Optional[int] = Field(default=None, ge=1, le=5)
	probability: Optional[int] = Field(default=None, ge=1, le=5)
	category: Optional[Category] = None
	risk_owner: Optional[str] = Field(default=None, max_length=100)
	department: Optional[str] = Field(default=None, max_length=100)
	location: Optional[str] = Field(default=None, max_length=100)
	root_cause: Optional[str] = None
	mitigation_strategy: Optional[str] = None
	contingency_plan: Optional[str] = None
	target_date: Optional[datetime] = None
	review_date: Optional[datetime] = None
	status: Optional[Status] = None
	assigned_to: Optional[int] = None


class RiskRead(RiskBase):
	id: int
	owner_id: int
	created_at: datetime
	updated_at: datetime
	score: int
	risk_level: str

	class Config:
		from_attributes = True


