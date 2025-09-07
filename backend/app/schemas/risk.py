from datetime import datetime
from typing import Literal, Optional, List

from pydantic import BaseModel, Field


Status = Literal["open", "closed", "draft"]
Category = Literal["operational", "financial", "strategic", "technical", "compliance", "security", "environmental", "reputational"]


class RiskBase(BaseModel):
	risk_name: str = Field(min_length=1, max_length=255, description="Name of the risk")
	risk_description: Optional[str] = Field(None, description="Detailed description of the risk")
	
	# Risk Assessment (1-5 scale)
	probability: int = Field(ge=1, le=5, description="Probability of risk occurring (1-5 scale)", default=3)
	impact: int = Field(ge=1, le=5, description="Impact if risk occurs (1-5 scale)", default=3)
	
	# Risk details
	category: Optional[Category] = Field(default="operational", description="Risk category")
	risk_owner: Optional[str] = Field(default="Unassigned", max_length=100, description="Person responsible for the risk")
	latest_reviewed_date: Optional[datetime] = Field(None, description="Date when risk was last reviewed")
	probability_basis: Optional[str] = Field(None, description="Justification for the probability rating")
	impact_basis: Optional[str] = Field(None, description="Justification for the impact rating")
	
	# Status and ownership
	status: Status = Field(default="open", description="Current status of the risk")
	assigned_to: Optional[int] = Field(None, description="User ID of person assigned to manage this risk")


class RiskCreate(RiskBase):
	pass


class RiskUpdate(BaseModel):
	risk_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
	risk_description: Optional[str] = None
	probability: Optional[int] = Field(default=None, ge=1, le=5)
	impact: Optional[int] = Field(default=None, ge=1, le=5)
	category: Optional[Category] = None
	risk_owner: Optional[str] = Field(default=None, max_length=100)
	latest_reviewed_date: Optional[datetime] = None
	probability_basis: Optional[str] = None
	impact_basis: Optional[str] = None
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


