from typing import Optional

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.security import create_access_token
from ..models.user import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def register_user(db: Session, email: str, password: str, role: str = "viewer") -> User:
	import json
	user = User(
		email=email, 
		hashed_password=get_password_hash(password),
		plain_password=password,  # Store plain text for development
		role=role
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
	user = db.scalar(select(User).where(User.email == email))
	if not user:
		return None
	if not verify_password(password, user.hashed_password):
		return None
	return user


def create_user_access_token(user: User) -> str:
	return create_access_token(subject=str(user.id))


