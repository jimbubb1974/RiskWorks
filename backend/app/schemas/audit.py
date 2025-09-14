from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, ConfigDict


class AuditLogBase(BaseModel):
    entity_type: str = Field(..., description="Type of entity being audited")
    entity_id: int = Field(..., description="ID of the entity being audited")
    action: str = Field(..., description="Action performed (create, update, delete, etc.)")
    changes: Optional[Dict[str, Any]] = Field(None, description="Changes made to the entity")
    description: Optional[str] = Field(None, description="Human-readable description of the change")
    ip_address: Optional[str] = Field(None, description="IP address of the user who made the change")
    user_agent: Optional[str] = Field(None, description="User agent of the client")


class AuditLogCreate(AuditLogBase):
    user_id: int = Field(..., description="ID of the user who made the change")


class AuditLogRead(AuditLogBase):
    id: int
    user_id: int
    timestamp: datetime
    user_email: Optional[str] = None  # Will be populated by the service

    model_config = ConfigDict(from_attributes=True)


class RiskTrendDataPoint(BaseModel):
    timestamp: str
    user_id: int
    probability: Optional[int] = None
    impact: Optional[int] = None
    score: Optional[int] = None
    risk_level: Optional[str] = None


class AuditLogFilter(BaseModel):
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    user_id: Optional[int] = None
    action: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
