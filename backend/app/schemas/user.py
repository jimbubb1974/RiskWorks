from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
	email: EmailStr
	password: str


class UserLogin(BaseModel):
	email: EmailStr
	password: str


class UserRead(BaseModel):
	id: int
	email: EmailStr
	hashed_password: str
	plain_password: str | None = None  # For development only
	created_at: datetime

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


