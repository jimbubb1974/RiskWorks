from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


Status = Literal["open", "mitigated", "closed"]


class RiskBase(BaseModel):
	title: str = Field(min_length=1, max_length=255)
	description: Optional[str] = None
	severity: int = Field(ge=1, le=5)
	probability: int = Field(ge=1, le=5)
	status: Status = "open"


class RiskCreate(RiskBase):
	pass


class RiskUpdate(BaseModel):
	title: Optional[str] = Field(default=None, min_length=1, max_length=255)
	description: Optional[str] = None
	severity: Optional[int] = Field(default=None, ge=1, le=5)
	probability: Optional[int] = Field(default=None, ge=1, le=5)
	status: Optional[Status] = None


class RiskRead(RiskBase):
	id: int
	owner_id: int
	created_at: datetime
	updated_at: datetime

	class Config:
		from_attributes = True


