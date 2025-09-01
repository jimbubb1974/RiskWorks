from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt

from .config import settings


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
	"""Create a signed JWT access token for the given subject (user id or email)."""
	expires_delta = timedelta(minutes=expires_minutes or settings.access_token_expires_minutes)
	expire = datetime.now(tz=timezone.utc) + expires_delta
	to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
	encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
	return encoded_jwt


def verify_token(token: str) -> Optional[str]:
	"""Verify token and return subject if valid, else None."""
	try:
		payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
		return str(payload.get("sub")) if payload.get("sub") else None
	except JWTError:
		return None


