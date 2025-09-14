from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.snapshot import Snapshot
from ..models.risk import Risk
from ..models.action_item import ActionItem
from ..schemas.snapshot import SnapshotCreate, SnapshotUpdate


class SnapshotService:
    def __init__(self, db: Session):
        self.db = db

    def create_snapshot(self, snapshot_data: SnapshotCreate, user_id: int) -> Snapshot:
        """Create a new snapshot of current risk and action item data"""
        
        # Get all current risks
        risks = self.db.query(Risk).all()
        risk_data = {
            "risks": [
                {
                    "id": risk.id,
                    "risk_name": risk.risk_name,
                    "risk_description": risk.risk_description,
                    "probability": risk.probability,
                    "impact": risk.impact,
                    "category": risk.category,
                    "risk_owner": risk.risk_owner,
                    "latest_reviewed_date": risk.latest_reviewed_date.isoformat() if risk.latest_reviewed_date else None,
                    "probability_basis": risk.probability_basis,
                    "impact_basis": risk.impact_basis,
                    "notes": risk.notes,
                    "status": risk.status,
                    "owner_id": risk.owner_id,
                    "assigned_to": risk.assigned_to,
                    "created_at": risk.created_at.isoformat(),
                    "updated_at": risk.updated_at.isoformat(),
                }
                for risk in risks
            ],
            "snapshot_created_at": datetime.now(timezone.utc).isoformat(),
            "total_risks": len(risks)
        }

        # Get all current action items
        action_items = self.db.query(ActionItem).all()
        action_items_data = {
            "action_items": [
                {
                    "id": item.id,
                    "title": item.title,
                    "description": item.description,
                    "status": item.status,
                    "priority": item.priority,
                    "assigned_to": item.assigned_to,
                    "due_date": item.due_date.isoformat() if item.due_date else None,
                    "risk_id": item.risk_id,
                    "created_at": item.created_at.isoformat(),
                    "updated_at": item.updated_at.isoformat(),
                }
                for item in action_items
            ],
            "snapshot_created_at": datetime.now(timezone.utc).isoformat(),
            "total_action_items": len(action_items)
        }

        # Create snapshot record
        snapshot = Snapshot(
            name=snapshot_data.name,
            description=snapshot_data.description,
            risk_data=risk_data,
            action_items_data=action_items_data,
            created_by=user_id
        )

        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_snapshots(self, user_id: Optional[int] = None) -> List[Snapshot]:
        """Get all snapshots, optionally filtered by user"""
        query = self.db.query(Snapshot)
        if user_id:
            query = query.filter(Snapshot.created_by == user_id)
        return query.order_by(desc(Snapshot.created_at)).all()

    def get_snapshot(self, snapshot_id: int) -> Optional[Snapshot]:
        """Get a specific snapshot by ID"""
        return self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()

    def update_snapshot(self, snapshot_id: int, snapshot_data: SnapshotUpdate) -> Optional[Snapshot]:
        """Update snapshot metadata"""
        snapshot = self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            return None

        if snapshot_data.name is not None:
            snapshot.name = snapshot_data.name
        if snapshot_data.description is not None:
            snapshot.description = snapshot_data.description

        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def delete_snapshot(self, snapshot_id: int) -> bool:
        """Delete a snapshot"""
        snapshot = self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            return False

        self.db.delete(snapshot)
        self.db.commit()
        return True

    def restore_snapshot(self, snapshot_id: int, user_id: int) -> Dict[str, Any]:
        """Restore data from a snapshot"""
        snapshot = self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            return {"success": False, "message": "Snapshot not found"}

        try:
            # Clear existing data
            self.db.query(ActionItem).delete()
            self.db.query(Risk).delete()
            self.db.commit()

            # Restore risks and create ID mapping
            risks_data = snapshot.risk_data.get("risks", [])
            restored_risks = 0
            risk_id_mapping = {}  # Maps old risk ID to new risk ID
            
            for risk_data in risks_data:
                # Convert ISO strings back to datetime objects
                risk_data_copy = risk_data.copy()
                if risk_data_copy.get("latest_reviewed_date"):
                    risk_data_copy["latest_reviewed_date"] = datetime.fromisoformat(risk_data_copy["latest_reviewed_date"])
                if risk_data_copy.get("created_at"):
                    risk_data_copy["created_at"] = datetime.fromisoformat(risk_data_copy["created_at"])
                if risk_data_copy.get("updated_at"):
                    risk_data_copy["updated_at"] = datetime.fromisoformat(risk_data_copy["updated_at"])

                # Store the old ID before removing it
                old_risk_id = risk_data_copy.pop("id", None)
                
                # Remove legacy fields that no longer exist in the model
                legacy_fields = ["title", "description", "likelihood", "severity", "department", 
                               "location", "root_cause", "mitigation_strategy", "contingency_plan", 
                               "target_date", "review_date"]
                for field in legacy_fields:
                    risk_data_copy.pop(field, None)
                
                # Ensure required fields have defaults
                if "probability" not in risk_data_copy:
                    risk_data_copy["probability"] = 3
                if "impact" not in risk_data_copy:
                    risk_data_copy["impact"] = 3
                if "status" not in risk_data_copy:
                    risk_data_copy["status"] = "open"
                if "category" not in risk_data_copy:
                    risk_data_copy["category"] = "operational"
                if "risk_owner" not in risk_data_copy:
                    risk_data_copy["risk_owner"] = "Unassigned"
                
                risk = Risk(**risk_data_copy)
                self.db.add(risk)
                self.db.flush()  # Flush to get the new ID
                
                # Map old ID to new ID
                if old_risk_id is not None:
                    risk_id_mapping[old_risk_id] = risk.id
                
                restored_risks += 1

            # Restore action items with updated risk IDs
            action_items_data = snapshot.action_items_data.get("action_items", []) if snapshot.action_items_data else []
            restored_action_items = 0
            for item_data in action_items_data:
                # Convert ISO strings back to datetime objects
                item_data_copy = item_data.copy()
                if item_data_copy.get("due_date"):
                    item_data_copy["due_date"] = datetime.fromisoformat(item_data_copy["due_date"])
                if item_data_copy.get("created_at"):
                    item_data_copy["created_at"] = datetime.fromisoformat(item_data_copy["created_at"])
                if item_data_copy.get("updated_at"):
                    item_data_copy["updated_at"] = datetime.fromisoformat(item_data_copy["updated_at"])

                # Remove the id to let the database assign a new one
                item_data_copy.pop("id", None)
                
                # Update risk_id to use the new mapped ID
                old_risk_id = item_data_copy.get("risk_id")
                if old_risk_id in risk_id_mapping:
                    item_data_copy["risk_id"] = risk_id_mapping[old_risk_id]
                else:
                    # Skip action items that reference non-existent risks
                    continue
                
                # Ensure required fields have defaults
                if "created_by" not in item_data_copy or item_data_copy["created_by"] is None:
                    item_data_copy["created_by"] = user_id  # Use the current user as creator
                if "action_type" not in item_data_copy:
                    item_data_copy["action_type"] = "mitigation"
                if "priority" not in item_data_copy:
                    item_data_copy["priority"] = "medium"
                if "status" not in item_data_copy:
                    item_data_copy["status"] = "pending"
                if "progress_percentage" not in item_data_copy:
                    item_data_copy["progress_percentage"] = 0
                
                action_item = ActionItem(**item_data_copy)
                self.db.add(action_item)
                restored_action_items += 1

            self.db.commit()

            return {
                "success": True,
                "message": f"Successfully restored {restored_risks} risks and {restored_action_items} action items",
                "restored_risks": restored_risks,
                "restored_action_items": restored_action_items
            }

        except Exception as e:
            self.db.rollback()
            import traceback
            error_details = traceback.format_exc()
            print(f"Snapshot restore error: {error_details}")  # Log to console for debugging
            return {"success": False, "message": f"Restore failed: {str(e)}"}
