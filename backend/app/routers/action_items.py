from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.action_item import ActionItem, ActionItemCreate, ActionItemUpdate
from ..services.action_items import ActionItemService
from ..core.security import verify_token

router = APIRouter(prefix="/action-items", tags=["action-items"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


@router.get("/", response_model=List[ActionItem])
async def get_action_items(
    risk_id: int = None,
    status: str = None,
    assigned_to: int = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get action items with optional filtering"""
    service = ActionItemService(db)
    return service.get_action_items(
        risk_id=risk_id,
        status=status,
        assigned_to=assigned_to
    )


@router.get("/{action_item_id}", response_model=ActionItem)
async def get_action_item(
    action_item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Get a specific action item by ID"""
    service = ActionItemService(db)
    action_item = service.get_action_item(action_item_id)
    if not action_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )
    return action_item


@router.post("/", response_model=ActionItem, status_code=status.HTTP_201_CREATED)
async def create_action_item(
    action_item: ActionItemCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Create a new action item"""
    service = ActionItemService(db)
    return service.create_action_item(action_item, user_id)


@router.put("/{action_item_id}", response_model=ActionItem)
async def update_action_item(
    action_item_id: int,
    action_item_update: ActionItemUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update an existing action item"""
    service = ActionItemService(db)
    updated_item = service.update_action_item(action_item_id, action_item_update, user_id)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )
    return updated_item


@router.delete("/{action_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_action_item(
    action_item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Delete an action item"""
    service = ActionItemService(db)
    success = service.delete_action_item(action_item_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )


@router.patch("/{action_item_id}/status", response_model=ActionItem)
async def update_action_item_status(
    action_item_id: int,
    status: str,
    progress_percentage: int = None,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Update action item status and progress"""
    service = ActionItemService(db)
    updated_item = service.update_status(action_item_id, status, progress_percentage)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Action item not found"
        )
    return updated_item
