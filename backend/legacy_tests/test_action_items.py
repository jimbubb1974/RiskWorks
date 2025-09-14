#!/usr/bin/env python3
"""Test script for action items functionality"""

import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

from database import get_db
from models.action_item import ActionItem
from models.risk import Risk
from models.user import User
from schemas.action_item import ActionItemCreate

def test_action_items():
    """Test creating and retrieving action items"""
    print("Testing Action Items functionality...")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get the first user and risk for testing
        user = db.query(User).first()
        risk = db.query(Risk).first()
        
        if not user:
            print("❌ No users found in database")
            return
            
        if not risk:
            print("❌ No risks found in database")
            return
            
        print(f"✅ Using user: {user.email}")
        print(f"✅ Using risk: {risk.title}")
        
        # Create a test action item
        action_item_data = ActionItemCreate(
            title="Implement firewall rules",
            description="Configure network firewall to block unauthorized access",
            action_type="mitigation",
            priority="high",
            status="pending",
            risk_id=risk.id,
            due_date=None,
            progress_percentage=0
        )
        
        # Create the action item
        action_item = ActionItem(
            **action_item_data.dict(),
            created_by=user.id,
            assigned_to=user.id
        )
        
        db.add(action_item)
        db.commit()
        db.refresh(action_item)
        
        print(f"✅ Created action item: {action_item.title}")
        print(f"   ID: {action_item.id}")
        print(f"   Status: {action_item.status}")
        print(f"   Priority: {action_item.priority}")
        
        # Test retrieving action items for the risk
        risk_action_items = db.query(ActionItem).filter(ActionItem.risk_id == risk.id).all()
        print(f"✅ Found {len(risk_action_items)} action items for risk")
        
        # Test updating action item status
        action_item.status = "in_progress"
        action_item.progress_percentage = 50
        db.commit()
        db.refresh(action_item)
        
        print(f"✅ Updated action item status to: {action_item.status}")
        print(f"   Progress: {action_item.progress_percentage}%")
        
        # Clean up - delete the test action item
        db.delete(action_item)
        db.commit()
        print("✅ Cleaned up test action item")
        
        print("\n🎉 Action Items functionality test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing action items: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_action_items()
