from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db
from ..schemas.rbs import RBSNodeCreate, RBSNodeRead, RBSNodeUpdate
from ..services import rbs as rbs_service


router = APIRouter(prefix="/rbs", tags=["rbs"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


@router.get("", response_model=List[RBSNodeRead])
def list_nodes(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return rbs_service.list_nodes(db, owner_id=user_id)


@router.get("/tree", response_model=List[RBSNodeRead])
def list_tree(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return rbs_service.list_tree(db, owner_id=user_id)


@router.post("", response_model=RBSNodeRead, status_code=status.HTTP_201_CREATED)
def create_node(payload: RBSNodeCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    return rbs_service.create_node(db, owner_id=user_id, **payload.model_dump())


@router.put("/{node_id}", response_model=RBSNodeRead)
def update_node(node_id: int, payload: RBSNodeUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    node = rbs_service.update_node(db, owner_id=user_id, node_id=node_id, **payload.model_dump())
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RBS node not found")
    return node


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(node_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    ok = rbs_service.delete_node(db, owner_id=user_id, node_id=node_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RBS node not found")
    return None


