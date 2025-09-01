from typing import Iterable, Optional

from sqlalchemy import select, desc, asc
from sqlalchemy.orm import Session

from ..models.risk import Risk


def list_risks(
	db: Session,
	owner_id: int,
	status: Optional[str] = None,
	min_severity: Optional[int] = None,
	search: Optional[str] = None,
	sort_by: Optional[str] = None,
	order: str = "desc",
	limit: int = 50,
	offset: int = 0,
):
	stmt = select(Risk).where(Risk.owner_id == owner_id)
	if status:
		stmt = stmt.where(Risk.status == status)
	if min_severity is not None:
		stmt = stmt.where(Risk.severity >= min_severity)
	if search:
		like = f"%{search}%"
		stmt = stmt.where(Risk.title.ilike(like))
	if sort_by in {"created_at", "updated_at", "severity", "probability", "title", "status"}:
		col = getattr(Risk, sort_by)
		stmt = stmt.order_by(desc(col) if order == "desc" else asc(col))
	else:
		stmt = stmt.order_by(desc(Risk.created_at))
	stmt = stmt.limit(limit).offset(offset)
	return list(db.scalars(stmt))


def create_risk(db: Session, owner_id: int, *, title: str, description: str | None, severity: int, probability: int, status: str) -> Risk:
	risk = Risk(
		title=title,
		description=description,
		severity=severity,
		probability=probability,
		status=status,
		owner_id=owner_id,
	)
	db.add(risk)
	db.commit()
	db.refresh(risk)
	return risk


def get_risk(db: Session, owner_id: int, risk_id: int) -> Optional[Risk]:
	return db.get(Risk, risk_id) if (r := db.get(Risk, risk_id)) and r.owner_id == owner_id else None


def update_risk(db: Session, owner_id: int, risk_id: int, **updates) -> Optional[Risk]:
	risk = db.get(Risk, risk_id)
	if not risk or risk.owner_id != owner_id:
		return None
	for key, value in updates.items():
		if value is not None:
			setattr(risk, key, value)
	db.commit()
	db.refresh(risk)
	return risk


def delete_risk(db: Session, owner_id: int, risk_id: int) -> bool:
	risk = db.get(Risk, risk_id)
	if not risk or risk.owner_id != owner_id:
		return False
	db.delete(risk)
	db.commit()
	return True


