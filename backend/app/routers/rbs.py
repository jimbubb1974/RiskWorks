from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db
from ..schemas.rbs import RBSNodeCreate, RBSNodeRead, RBSNodeUpdate, RBSNodeTree
from ..services import rbs as rbs_service
from ..models.user import User


router = APIRouter(prefix="/rbs", tags=["rbs"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


def get_current_user(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("", response_model=List[RBSNodeRead])
def list_nodes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Managers and admins can see all RBS nodes, others only see their own
    if current_user.role in ["manager", "admin"]:
        return rbs_service.list_all_nodes(db)
    else:
        return rbs_service.list_nodes(db, owner_id=current_user.id)


@router.get("/tree", response_model=List[RBSNodeTree])
def list_tree(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Managers and admins can see all RBS nodes, others only see their own
    if current_user.role in ["manager", "admin"]:
        roots = rbs_service.list_all_tree(db)
    else:
        roots = rbs_service.list_tree(db, owner_id=current_user.id)
    
    # Convert ORM to nested dicts suitable for Pydantic
    def to_tree(node):
        return {
            "id": node.id,
            "name": node.name,
            "description": node.description,
            "order_index": node.order_index,
            "parent_id": node.parent_id,
            "children": [to_tree(c) for c in getattr(node, "children", [])],
        }

    return [to_tree(n) for n in roots]


@router.post("", response_model=RBSNodeRead, status_code=status.HTTP_201_CREATED)
def create_node(payload: RBSNodeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return rbs_service.create_node(db, owner_id=current_user.id, **payload.model_dump())


@router.put("/{node_id}", response_model=RBSNodeRead)
def update_node(node_id: int, payload: RBSNodeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user can edit this node (owner or manager/admin)
    if current_user.role in ["manager", "admin"]:
        node = rbs_service.update_node_any(db, node_id=node_id, **payload.model_dump())
    else:
        node = rbs_service.update_node(db, owner_id=current_user.id, node_id=node_id, **payload.model_dump())
    
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RBS node not found")
    return node


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(node_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user can delete this node (owner or manager/admin)
    if current_user.role in ["manager", "admin"]:
        ok = rbs_service.delete_node_any(db, node_id=node_id)
    else:
        ok = rbs_service.delete_node(db, owner_id=current_user.id, node_id=node_id)
    
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RBS node not found")
    return None


@router.post("/{node_id}/move", response_model=RBSNodeRead)
def move_node(node_id: int, direction: str = Query(pattern="^(up|down)$"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if user can move this node (owner or manager/admin)
    if current_user.role in ["manager", "admin"]:
        node = rbs_service.move_node_any(db, node_id=node_id, direction=direction)
    else:
        node = rbs_service.move_node(db, owner_id=current_user.id, node_id=node_id, direction=direction)
    
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RBS node not found")
    return node


