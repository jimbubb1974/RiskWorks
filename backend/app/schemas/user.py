from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserCreate(BaseModel):
	email: EmailStr
	password: str
	role: Optional[str] = Field(default="viewer", description="User role (viewer, editor, manager)")


class UserLogin(BaseModel):
	email: EmailStr
	password: str


class UserRead(BaseModel):
	id: int
	email: EmailStr
	hashed_password: str
	plain_password: str | None = None  # For development only
	role: str = Field(default="viewer", description="User role")
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
	email: Optional[EmailStr] = None
	role: Optional[str] = None


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


