import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt

# Import your app and database components (corrected paths)
from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.models.risk import Risk

# Create a test database (in-memory SQLite for speed)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override the database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

# Create the test client
client = TestClient(app)

@pytest.fixture(scope="function")
def setup_database():
    """Set up a fresh database for each test"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a test user for authentication
    db = TestingSessionLocal()
    hashed_password = bcrypt.hashpw("testpass123".encode('utf-8'), bcrypt.gensalt())
    test_user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=hashed_password.decode('utf-8'),
        is_active=True
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Login to get auth token
    login_response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "testpass123"
    })
    token = login_response.json()["access_token"]
    
    yield {
        "token": token,
        "user_id": test_user.id,
        "headers": {"Authorization": f"Bearer {token}"}
    }
    
    # Cleanup
    db.close()
    Base.metadata.drop_all(bind=engine)


def test_create_risk_integration(setup_database):
    """
    Integration test: Create a risk and verify it's saved correctly to database
    
    This tests:
    1. API endpoint receives the request correctly
    2. Risk is created with proper calculations (risk_score = probability * impact)
    3. Risk is persisted to database
    4. Response contains expected data
    """
    auth_data = setup_database
    
    # Test data for creating a risk
    risk_data = {
        "title": "Server Downtime Risk",
        "description": "Risk of main server going down during peak hours",
        "category": "Technology",
        "probability": 3,  # Medium probability
        "impact": 4,       # High impact
        "status": "Open"
    }
    
    # Make API call to create risk
    response = client.post(
        "/risks/",
        json=risk_data,
        headers=auth_data["headers"]
    )
    
    # Verify API response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    created_risk = response.json()
    
    # Verify response data
    assert created_risk["title"] == risk_data["title"]
    assert created_risk["description"] == risk_data["description"]
    assert created_risk["category"] == risk_data["category"]
    assert created_risk["probability"] == risk_data["probability"]
    assert created_risk["impact"] == risk_data["impact"]
    assert created_risk["status"] == risk_data["status"]
    
    # Verify risk score calculation (this is critical business logic!)
    expected_risk_score = risk_data["probability"] * risk_data["impact"]  # 3 * 4 = 12
    assert created_risk["risk_score"] == expected_risk_score
    
    # Verify it's actually in the database (not just the API response)
    risk_id = created_risk["id"]
    
    # Query database directly to confirm persistence
    db = TestingSessionLocal()
    try:
        db_risk = db.query(Risk).filter(Risk.id == risk_id).first()
        
        assert db_risk is not None, "Risk was not saved to database"
        assert db_risk.title == risk_data["title"]
        assert db_risk.probability == risk_data["probability"]
        assert db_risk.impact == risk_data["impact"]
        assert db_risk.risk_score == expected_risk_score
        assert db_risk.owner_id == auth_data["user_id"]
        
    finally:
        db.close()


def test_edit_risk_integration(setup_database):
    """
    Integration test: Create a risk, edit it, verify changes persist
    
    This is your most critical flow based on your answers!
    """
    auth_data = setup_database
    
    # First, create a risk
    initial_risk_data = {
        "title": "Initial Risk",
        "description": "Initial description",
        "category": "Operational",
        "probability": 2,
        "impact": 3,
        "status": "Open"
    }
    
    create_response = client.post(
        "/risks/",
        json=initial_risk_data,
        headers=auth_data["headers"]
    )
    assert create_response.status_code == 201
    risk_id = create_response.json()["id"]
    
    # Now edit the risk
    updated_risk_data = {
        "title": "Updated Risk Title",
        "description": "Updated description with more details",
        "category": "Technology",  # Changed category
        "probability": 4,          # Changed probability
        "impact": 5,              # Changed impact
        "status": "In Progress"    # Changed status
    }
    
    # Make the edit API call
    edit_response = client.put(
        f"/risks/{risk_id}",
        json=updated_risk_data,
        headers=auth_data["headers"]
    )
    
    # Verify edit response
    assert edit_response.status_code == 200
    updated_risk = edit_response.json()
    
    # Verify all changes were applied
    assert updated_risk["title"] == updated_risk_data["title"]
    assert updated_risk["description"] == updated_risk_data["description"]
    assert updated_risk["category"] == updated_risk_data["category"]
    assert updated_risk["probability"] == updated_risk_data["probability"]
    assert updated_risk["impact"] == updated_risk_data["impact"]
    assert updated_risk["status"] == updated_risk_data["status"]
    
    # Verify risk score recalculation
    expected_new_score = updated_risk_data["probability"] * updated_risk_data["impact"]  # 4 * 5 = 20
    assert updated_risk["risk_score"] == expected_new_score
    
    # THE CRITICAL CHECK: Verify changes actually persisted to database
    db = TestingSessionLocal()
    try:
        db_risk = db.query(Risk).filter(Risk.id == risk_id).first()
        
        # These assertions verify your most critical concern: 
        # "edits be written into the database correctly"
        assert db_risk.title == updated_risk_data["title"]
        assert db_risk.description == updated_risk_data["description"]
        assert db_risk.probability == updated_risk_data["probability"]
        assert db_risk.impact == updated_risk_data["impact"]
        assert db_risk.risk_score == expected_new_score
        assert db_risk.status == updated_risk_data["status"]
        
    finally:
        db.close()


if __name__ == "__main__":
    # You can run this test with: python test_risk_integration.py
    pytest.main([__file__, "-v"])
