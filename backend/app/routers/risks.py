from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..core.security import verify_token
from ..database import get_db
from ..schemas.risk import RiskCreate, RiskRead, RiskUpdate
from ..services.risk import create_risk, delete_risk, get_risk, list_risks, update_risk


router = APIRouter(prefix="/risks", tags=["risks"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
	user_id = verify_token(token)
	if not user_id:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
	return int(user_id)


@router.get("", response_model=list[RiskRead])
def list_risks_endpoint(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    min_severity: Optional[int] = Query(default=None),
    min_likelihood: Optional[int] = Query(default=None),
    min_impact: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default=None),
    order: str = Query(default="desc"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return list_risks(
        db,
        owner_id=user_id,
        status=status_filter,
        min_severity=min_severity,
        min_likelihood=min_likelihood,
        min_impact=min_impact,
        search=search,
        sort_by=sort_by,
        order=order,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=RiskRead, status_code=status.HTTP_201_CREATED)
def create_risk_endpoint(payload: RiskCreate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
	# Convert payload to dict and handle new fields
	risk_data = payload.model_dump()
	
	# Ensure likelihood and impact are set
	if "likelihood" not in risk_data:
		risk_data["likelihood"] = 3
	if "impact" not in risk_data:
		risk_data["impact"] = 3
	
	risk = create_risk(db, owner_id=user_id, **risk_data)
	return risk


@router.get("/{risk_id}", response_model=RiskRead)
def get_risk_endpoint(risk_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
	risk = get_risk(db, owner_id=user_id, risk_id=risk_id)
	if not risk:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
	return risk


@router.put("/{risk_id}", response_model=RiskRead)
def update_risk_endpoint(risk_id: int, payload: RiskUpdate, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
	risk = update_risk(db, owner_id=user_id, risk_id=risk_id, **payload.model_dump())
	if not risk:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
	return risk


@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk_endpoint(risk_id: int, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
	success = delete_risk(db, owner_id=user_id, risk_id=risk_id)
	if not success:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
	return None


