from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


@router.get("", response_model=list[UserRead])
def list_users_endpoint(
    search: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    List all users with optional filtering.
    Note: In a real application, you'd want role-based access control here.
    """
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))
    
    # For now, we'll add role and status fields to the User model later
    # if role:
    #     query = query.filter(User.role == role)
    # if status:
    #     query = query.filter(User.status == status)
    
    # Apply pagination
    users = query.offset(offset).limit(limit).all()
    
    return users


@router.get("/{user_id}", response_model=UserRead)
def get_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Get a specific user by ID.
    Note: In a real application, you'd want role-based access control here.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user
