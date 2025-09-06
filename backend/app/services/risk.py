from typing import Iterable, Optional

from sqlalchemy import select, desc, asc
from sqlalchemy.orm import Session

from ..models.risk import Risk


def list_risks(
	db: Session,
	owner_id: int,
	status: Optional[str] = None,
	min_severity: Optional[int] = None,
	min_likelihood: Optional[int] = None,
	min_impact: Optional[int] = None,
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
	if min_likelihood is not None:
		stmt = stmt.where(Risk.likelihood >= min_likelihood)
	if min_impact is not None:
		stmt = stmt.where(Risk.impact >= min_impact)
	if search:
		like = f"%{search}%"
		stmt = stmt.where(Risk.title.ilike(like))
	if sort_by == "score":
		# Sort by computed score (likelihood * impact)
		score_expr = Risk.likelihood * Risk.impact
		stmt = stmt.order_by(desc(score_expr) if order == "desc" else asc(score_expr))
	elif sort_by in {"created_at", "updated_at", "likelihood", "impact", "title", "status", "category"}:
		col = getattr(Risk, sort_by)
		stmt = stmt.order_by(desc(col) if order == "desc" else asc(col))
	else:
		stmt = stmt.order_by(desc(Risk.created_at))
	stmt = stmt.limit(limit).offset(offset)
	return list(db.scalars(stmt))


def create_risk(db: Session, owner_id: int, **risk_data) -> Risk:
	# Set defaults for new fields
	defaults = {
		"likelihood": 3,
		"impact": 3,
		"category": "operational",
		"risk_owner": "Unassigned",
		"department": "General",
		"location": "Unspecified",
		"status": "open"
	}
	
	# Update defaults with provided data
	risk_data = {**defaults, **risk_data}
	
	# Ensure required fields are present
	if "title" not in risk_data:
		raise ValueError("Title is required")
	
	# Map likelihood/impact to legacy fields for backward compatibility
	if "likelihood" in risk_data and "severity" not in risk_data:
		risk_data["severity"] = risk_data["likelihood"]
	if "impact" in risk_data and "probability" not in risk_data:
		risk_data["probability"] = risk_data["impact"]
	
	risk = Risk(owner_id=owner_id, **risk_data)
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


