from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json
import tempfile
import os
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..schemas.snapshot import Snapshot as SnapshotSchema, SnapshotCreate, SnapshotUpdate, SnapshotRestore
from ..models.snapshot import Snapshot
from ..services.snapshot import SnapshotService
from ..core.security import verify_token

router = APIRouter(prefix="/snapshots", tags=["snapshots"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return int(user_id)


def get_current_user(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Session = Depends(get_db)
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/", response_model=SnapshotSchema, status_code=status.HTTP_201_CREATED)
def create_snapshot(
    snapshot_data: SnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new snapshot of current risk and action item data"""
    snapshot_service = SnapshotService(db)
    snapshot = snapshot_service.create_snapshot(snapshot_data, current_user.id)
    return snapshot


@router.get("/", response_model=List[SnapshotSchema])
def get_snapshots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all snapshots for the current user"""
    snapshot_service = SnapshotService(db)
    snapshots = snapshot_service.get_snapshots(current_user.id)
    return snapshots


@router.get("/{snapshot_id}", response_model=SnapshotSchema)
def get_snapshot(
    snapshot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific snapshot by ID"""
    snapshot_service = SnapshotService(db)
    snapshot = snapshot_service.get_snapshot(snapshot_id)
    
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    # Check if user owns this snapshot
    if snapshot.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this snapshot"
        )
    
    return snapshot


@router.put("/{snapshot_id}", response_model=SnapshotSchema)
def update_snapshot(
    snapshot_id: int,
    snapshot_data: SnapshotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update snapshot metadata"""
    snapshot_service = SnapshotService(db)
    
    # Check if snapshot exists and user owns it
    snapshot = snapshot_service.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    if snapshot.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this snapshot"
        )
    
    updated_snapshot = snapshot_service.update_snapshot(snapshot_id, snapshot_data)
    if not updated_snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    return updated_snapshot


@router.delete("/{snapshot_id}")
def delete_snapshot(
    snapshot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a snapshot"""
    snapshot_service = SnapshotService(db)
    
    # Check if snapshot exists and user owns it
    snapshot = snapshot_service.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    if snapshot.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this snapshot"
        )
    
    success = snapshot_service.delete_snapshot(snapshot_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    return {"message": "Snapshot deleted successfully"}


@router.post("/{snapshot_id}/restore")
def restore_snapshot(
    snapshot_id: int,
    restore_data: SnapshotRestore,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore data from a snapshot"""
    if not restore_data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restore confirmation required"
        )
    
    snapshot_service = SnapshotService(db)
    
    # Check if snapshot exists and user owns it
    snapshot = snapshot_service.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    if snapshot.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to restore this snapshot"
        )
    
    result = snapshot_service.restore_snapshot(snapshot_id, current_user.id)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )
    
    return result


@router.get("/{snapshot_id}/export")
def export_snapshot(
    snapshot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export a snapshot as a downloadable JSON file"""
    snapshot_service = SnapshotService(db)
    
    # Check if snapshot exists and user owns it
    snapshot = snapshot_service.get_snapshot(snapshot_id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Snapshot not found"
        )
    
    if snapshot.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to export this snapshot"
        )
    
    # Create export data
    export_data = {
        "snapshot_info": {
            "id": snapshot.id,
            "name": snapshot.name,
            "description": snapshot.description,
            "created_at": snapshot.created_at.isoformat(),
            "created_by": snapshot.created_by,
            "risk_count": snapshot.risk_count,
            "action_items_count": snapshot.action_items_count
        },
        "risk_data": snapshot.risk_data,
        "action_items_data": snapshot.action_items_data,
        "export_info": {
            "exported_at": datetime.utcnow().isoformat(),
            "exported_by": current_user.id,
            "version": "1.0"
        }
    }
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(
        mode='w', 
        suffix='.json', 
        delete=False,
        prefix=f"riskworks_snapshot_{snapshot.id}_"
    )
    
    try:
        # Write JSON data to file
        json.dump(export_data, temp_file, indent=2, ensure_ascii=False)
        temp_file.close()
        
        # Create filename for download
        safe_name = "".join(c for c in snapshot.name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"RiskWorks_Snapshot_{safe_name}_{snapshot.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return FileResponse(
            path=temp_file.name,
            filename=filename,
            media_type='application/json',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export snapshot: {str(e)}"
        )


@router.post("/import")
def import_snapshot(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import a snapshot from an uploaded JSON file"""
    
    # Validate file type
    if not file.filename or not (file.filename.endswith('.json') or file.content_type == 'application/json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are supported"
        )
    
    snapshot_service = SnapshotService(db)
    
    try:
        # Read and parse the uploaded file
        content = file.file.read()
        import_data = json.loads(content.decode('utf-8'))
        
        # Validate the import data structure
        if not isinstance(import_data, dict):
            raise ValueError("Invalid file format: expected JSON object")
        
        if "snapshot_info" not in import_data:
            raise ValueError("Invalid file format: missing snapshot_info")
        
        if "risk_data" not in import_data:
            raise ValueError("Invalid file format: missing risk_data")
        
        # Extract snapshot metadata
        snapshot_info = import_data["snapshot_info"]
        risk_data = import_data["risk_data"]
        action_items_data = import_data.get("action_items_data")
        
        # Create a new snapshot with imported data
        snapshot_name = f"Imported: {snapshot_info.get('name', 'Unknown')}"
        snapshot_description = f"Imported from file: {file.filename}"
        
        # Create the snapshot record
        snapshot = Snapshot(
            name=snapshot_name,
            description=snapshot_description,
            risk_data=risk_data,
            action_items_data=action_items_data,
            created_by=current_user.id
        )
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        return {
            "success": True,
            "message": f"Successfully imported snapshot '{snapshot_name}'",
            "snapshot_id": snapshot.id,
            "imported_risks": len(risk_data.get("risks", [])),
            "imported_action_items": len(action_items_data.get("action_items", [])) if action_items_data else 0
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON file: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import snapshot: {str(e)}"
        )
