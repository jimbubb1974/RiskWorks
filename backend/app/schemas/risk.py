from datetime import datetime
from typing import Literal, Optional, List, Union

from pydantic import BaseModel, Field, field_validator


Status = Literal["open", "closed", "draft", "in_progress", "mitigated", "escalated"]
Scope = Literal["project", "site", "enterprise"]


class RiskBase(BaseModel):
	risk_name: str = Field(min_length=1, max_length=255, description="Name of the risk")
	risk_description: Optional[str] = Field(None, description="Detailed description of the risk")
	
	# Risk Assessment (1-5 scale)
	probability: Optional[int] = Field(None, ge=1, le=5, description="Probability of risk occurring (1-5 scale)")
	impact: Optional[int] = Field(None, ge=1, le=5, description="Impact if risk occurs (1-5 scale)")
	
	# Risk details
	scope: Scope = Field(default="project", description="Scope of the risk: project, site, or enterprise")
	risk_owner: Optional[str] = Field(default="Unassigned", max_length=100, description="Person responsible for the risk")
	rbs_node_id: Optional[int] = Field(default=None, description="Linked RBS node id; can be any level")
	latest_reviewed_date: Optional[Union[datetime, str]] = Field(None, description="Date when risk was last reviewed")
	
	@field_validator('latest_reviewed_date', mode='before')
	@classmethod
	def parse_latest_reviewed_date(cls, v):
		if v is None or v == "":
			return None
		if isinstance(v, str):
			try:
				return datetime.fromisoformat(v.replace('Z', '+00:00'))
			except ValueError:
				# If parsing fails, return None
				return None
		return v
	probability_basis: Optional[str] = Field(None, description="Justification for the probability rating")
	impact_basis: Optional[str] = Field(None, description="Justification for the impact rating")
	notes: Optional[str] = Field(None, description="Additional notes and comments about the risk")
	
	# Status and ownership
	status: Status = Field(default="open", description="Current status of the risk")


class RiskCreate(RiskBase):
	pass


class RiskUpdate(BaseModel):
	risk_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
	risk_description: Optional[str] = None
	probability: Optional[int] = Field(default=None, ge=1, le=5)
	impact: Optional[int] = Field(default=None, ge=1, le=5)
	scope: Optional[Scope] = None
	risk_owner: Optional[str] = Field(default=None, max_length=100)
	latest_reviewed_date: Optional[datetime] = None
	probability_basis: Optional[str] = None
	impact_basis: Optional[str] = None
	notes: Optional[str] = None
	status: Optional[Status] = None
	rbs_node_id: Optional[int] = None


class RiskRead(RiskBase):
	id: int
	owner_id: int
	created_at: datetime
	updated_at: datetime
	score: Optional[int]
	risk_level: str
	action_items_count: int

	class Config:
		from_attributes = True


