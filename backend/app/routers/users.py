from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..core.roles import Role, get_available_roles, get_role_permissions_list
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserRead, UserCreate, UserUpdate
from ..services.auth import register_user

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
    
    # For now, we'll add role field to the User model later
    # if role:
    #     query = query.filter(User.role == role)
    
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


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Create a new user (admin endpoint).
    Note: In a real application, you'd want role-based access control here.
    """
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    
    # Validate role
    if user_data.role and user_data.role not in [role.value for role in Role]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join([role.value for role in Role])}"
        )
    
    # Create the user
    user = register_user(
        db, 
        email=user_data.email, 
        password=user_data.password,
        role=user_data.role or "viewer"
    )
    return user


@router.put("/{user_id}", response_model=UserRead)
def update_user_endpoint(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Update a user (admin endpoint).
    Note: In a real application, you'd want role-based access control here.
    """
    import json
    
    # Get the user to update
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    # Check for email conflicts if email is being updated
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email already registered"
            )
    
    # Validate role if provided
    if user_data.role and user_data.role not in [role.value for role in Role]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join([role.value for role in Role])}"
        )
    
    # Update fields
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.role is not None:
        user.role = user_data.role
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/roles", response_model=list[dict])
def get_available_roles_endpoint():
    """Get list of available roles with descriptions."""
    return get_available_roles()


@router.get("/{user_id}/permissions", response_model=list[str])
def get_user_permissions_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Get permissions for a specific user based on their role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    return get_role_permissions_list(user.role)
