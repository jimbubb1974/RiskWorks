from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict


class SnapshotBase(BaseModel):
    name: str
    description: Optional[str] = None


class SnapshotCreate(SnapshotBase):
    pass


class SnapshotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class SnapshotInDB(SnapshotBase):
    id: int
    risk_data: Dict[str, Any]
    action_items_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    created_by: int

    model_config = ConfigDict(from_attributes=True)


class Snapshot(SnapshotInDB):
    risk_count: int
    action_items_count: int


class SnapshotRestore(BaseModel):
    snapshot_id: int
    confirm: bool = False
