from typing import Iterable, Optional

from sqlalchemy import select, desc, asc, distinct
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
	risk_owner: Optional[str] = None,
	rbs_node_id: Optional[int] = None,
	sort_by: Optional[str] = None,
	order: str = "desc",
	limit: int = 50,
	offset: int = 0,
	user_role: Optional[str] = None,
):
	# Managers and viewers can see all risks, others only see their own
	if user_role in ["manager", "viewer"]:
		stmt = select(Risk)
	else:
		stmt = select(Risk).where(Risk.owner_id == owner_id)
	if status:
		stmt = stmt.where(Risk.status == status)
	if min_severity is not None:
		stmt = stmt.where(Risk.severity >= min_severity)
	if min_likelihood is not None:
		stmt = stmt.where(Risk.probability >= min_likelihood)
	if min_impact is not None:
		stmt = stmt.where(Risk.impact >= min_impact)
	if search:
		like = f"%{search}%"
		stmt = stmt.where(Risk.risk_name.ilike(like))
	if risk_owner:
		stmt = stmt.where(Risk.risk_owner.ilike(f"%{risk_owner}%"))
	if rbs_node_id is not None:
		stmt = stmt.where(Risk.rbs_node_id == rbs_node_id)
	if sort_by == "score":
		# Sort by computed score (probability * impact)
		score_expr = Risk.probability * Risk.impact
		stmt = stmt.order_by(desc(score_expr) if order == "desc" else asc(score_expr))
	elif sort_by in {"created_at", "updated_at", "probability", "impact", "risk_name", "status"}:
		col = getattr(Risk, sort_by)
		stmt = stmt.order_by(desc(col) if order == "desc" else asc(col))
	else:
		stmt = stmt.order_by(desc(Risk.created_at))
	stmt = stmt.limit(limit).offset(offset)
	return list(db.scalars(stmt))


def create_risk(db: Session, owner_id: int, **risk_data) -> Risk:
	# Set defaults for new fields only if not provided
	defaults = {
		"scope": "project",
		"risk_owner": "Unassigned",
		"status": "open"
	}
	
	# Only set probability and impact defaults if they're not provided
	if "probability" not in risk_data:
		defaults["probability"] = 3
	if "impact" not in risk_data:
		defaults["impact"] = 3
	
	# Update defaults with provided data
	risk_data = {**defaults, **risk_data}
	
	# Ensure required fields are present
	if "risk_name" not in risk_data:
		raise ValueError("Risk name is required")
	
	risk = Risk(owner_id=owner_id, **risk_data)
	db.add(risk)
	db.commit()
	db.refresh(risk)
	
	# Log the creation
	from .audit import log_audit_event
	log_audit_event(
		db=db,
		entity_type="risk",
		entity_id=risk.id,
		user_id=owner_id,
		action="create",
		description=f"Risk '{risk.risk_name}' created"
	)
	
	return risk


def get_risk(db: Session, owner_id: int, risk_id: int, user_role: Optional[str] = None) -> Optional[Risk]:
	risk = db.get(Risk, risk_id)
	if not risk:
		return None
	# Managers and viewers can access any risk, others only their own
	if user_role in ["manager", "viewer"] or risk.owner_id == owner_id:
		return risk
	return None


def update_risk(db: Session, owner_id: int, risk_id: int, user_role: Optional[str] = None, **updates) -> Optional[Risk]:
	risk = db.get(Risk, risk_id)
	if not risk:
		return None
	# Managers can update any risk, others only their own
	if user_role != "manager" and risk.owner_id != owner_id:
		return None
	
	# Store the old state for audit logging
	old_risk = Risk(
		risk_name=risk.risk_name,
		risk_description=risk.risk_description,
		probability=risk.probability,
		impact=risk.impact,
		scope=risk.scope,
		risk_owner=risk.risk_owner,
		rbs_node_id=risk.rbs_node_id,
		latest_reviewed_date=risk.latest_reviewed_date,
		probability_basis=risk.probability_basis,
		impact_basis=risk.impact_basis,
		notes=risk.notes,
		status=risk.status
	)
	
	for key, value in updates.items():
		# Apply all provided fields, including explicit nulls, so rbs_node_id can be cleared
		setattr(risk, key, value)
	
	# updated_at will be automatically updated by SQLAlchemy due to onupdate=datetime.utcnow
	db.commit()
	db.refresh(risk)
	
	# Log the changes
	from .audit import log_audit_event, get_risk_changes
	changes = get_risk_changes(old_risk, risk)
	if changes:
		log_audit_event(
			db=db,
			entity_type="risk",
			entity_id=risk.id,
			user_id=owner_id,
			action="update",
			changes=changes,
			description=f"Risk '{risk.risk_name}' updated"
		)
	
	return risk


def delete_risk(db: Session, owner_id: int, risk_id: int, user_role: Optional[str] = None) -> bool:
	risk = db.get(Risk, risk_id)
	if not risk:
		return False
	# Managers can delete any risk, others only their own
	if user_role != "manager" and risk.owner_id != owner_id:
		return False
	
	# Log the deletion before deleting
	from .audit import log_audit_event
	log_audit_event(
		db=db,
		entity_type="risk",
		entity_id=risk.id,
		user_id=owner_id,
		action="delete",
		description=f"Risk '{risk.risk_name}' deleted"
	)
	
	db.delete(risk)
	db.commit()
	return True


def get_risk_owners(db: Session, owner_id: int) -> list[str]:
	"""Get unique risk owner names for the given user's risks."""
	stmt = select(distinct(Risk.risk_owner)).where(
		Risk.owner_id == owner_id,
		Risk.risk_owner.isnot(None),
		Risk.risk_owner != ""
	).order_by(Risk.risk_owner)
	
	owners = db.scalars(stmt).all()
	return [owner for owner in owners if owner]  # Filter out None/empty values


