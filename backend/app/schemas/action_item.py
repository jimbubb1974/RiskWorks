from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ActionItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    action_type: str = Field(default="mitigation", pattern="^(mitigation|contingency|monitoring)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    status: str = Field(default="pending", pattern="^(pending|in_progress|completed|cancelled)$")
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    progress_percentage: int = Field(default=0, ge=0, le=100)


class ActionItemCreate(ActionItemBase):
    risk_id: int


class ActionItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    action_type: Optional[str] = Field(None, pattern="^(mitigation|contingency|monitoring)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed|cancelled)$")
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)


class ActionItemInDB(ActionItemBase):
    id: int
    risk_id: int
    created_by: int
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActionItem(ActionItemInDB):
    pass
