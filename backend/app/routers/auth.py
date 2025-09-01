from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserRead, Token
from ..services.auth import authenticate_user, create_user_access_token, register_user


router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


DbDep = Depends(get_db)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = DbDep):
	existing = db.query(User).filter(User.email == payload.email).first()
	if existing:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
	user = register_user(db, email=payload.email, password=payload.password)
	return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = DbDep):
	user = authenticate_user(db, email=form_data.username, password=form_data.password)
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
	token = create_user_access_token(user)
	return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def me(token: Annotated[str, Depends(oauth2_scheme)], db: Session = DbDep):
	# For simplicity in Phase 1: decode subject and fetch user
	from ..core.security import verify_token
	user_id = verify_token(token)
	if not user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
	user = db.get(User, int(user_id))
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user


