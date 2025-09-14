from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class RBSNodeBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    order_index: int = Field(default=0, ge=0)
    parent_id: Optional[int] = None


class RBSNodeCreate(RBSNodeBase):
    pass


class RBSNodeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    order_index: Optional[int] = Field(default=None, ge=0)
    parent_id: Optional[int] = Field(default=None)


class RBSNodeRead(RBSNodeBase):
    id: int
    owner_id: int

    model_config = ConfigDict(from_attributes=True)


class RBSNodeTree(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    order_index: int
    parent_id: Optional[int] = None
    children: List["RBSNodeTree"] = Field(default_factory=list)


