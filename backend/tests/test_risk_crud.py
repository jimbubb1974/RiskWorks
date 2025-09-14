import os
import tempfile
from typing import Generator

import pytest
import anyio
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.database import Base
from app import models
from app.database import get_db
from app.services.auth import register_user, create_user_access_token


@pytest.fixture(scope="session")
def temp_db_url() -> Generator[str, None, None]:
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    url = f"sqlite:///{db_path}"
    try:
        yield url
    finally:
        try:
            os.remove(db_path)
        except FileNotFoundError:
            pass


@pytest.fixture()
def test_engine(temp_db_url: str):
    engine = create_engine(temp_db_url, connect_args={"check_same_thread": False})
    # Create all tables for a clean schema
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
        # Drop all tables and dispose engine to release file handles on Windows
        try:
            Base.metadata.drop_all(bind=engine)
        finally:
            engine.dispose()


@pytest.fixture()
def db_session(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def app_overridden(db_session):
    # Build app and override DB dependency to use our session
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture()
def auth_headers(db_session):
    # Create a test user and return Authorization header
    user = register_user(db_session, email="tester@example.com", password="test123", role="manager")
    token = create_user_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def test_risk_create_edit_and_persistence(app_overridden, db_session, auth_headers):
    app = app_overridden

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Create risk
            create_payload = {
                "risk_name": "API Latency",
                "risk_description": "High latency could impact UX",
                "probability": 3,
                "impact": 4,
                "scope": "project",
                "status": "open"
            }
            resp = await client.post("/risks", json=create_payload, headers=auth_headers)
            assert resp.status_code == 201, resp.text
            created = resp.json()

            # Validate created risk basics and score
            assert created["risk_name"] == create_payload["risk_name"]
            assert created["probability"] == 3
            assert created["impact"] == 4
            assert created["score"] == 12  # 3 × 4
            assert created["risk_level"] in {"Low", "Medium", "High", "Critical", "Not Assessed"}

            risk_id = created["id"]

            # Fetch created risk (persistence check through API read)
            get_resp = await client.get(f"/risks/{risk_id}", headers=auth_headers)
            assert get_resp.status_code == 200
            fetched = get_resp.json()
            assert fetched["id"] == risk_id
            assert fetched["score"] == 12

            # Update risk probability and impact and verify score
            update_payload = {
                "probability": 5,
                "impact": 5,
                "status": "in_progress",
            }
            upd = await client.put(f"/risks/{risk_id}", json=update_payload, headers=auth_headers)
            assert upd.status_code == 200, upd.text
            updated = upd.json()
            assert updated["probability"] == 5
            assert updated["impact"] == 5
            assert updated["score"] == 25  # 5 × 5
            assert updated["status"] == "in_progress"

            # Verify persistence by fetching again
            get_resp2 = await client.get(f"/risks/{risk_id}", headers=auth_headers)
            assert get_resp2.status_code == 200
            fetched2 = get_resp2.json()
            assert fetched2["score"] == 25

            # Negative test: set probability to None and ensure score becomes None
            upd2 = await client.put(f"/risks/{risk_id}", json={"probability": None}, headers=auth_headers)
            assert upd2.status_code == 200, upd2.text
            updated2 = upd2.json()
            assert updated2["probability"] is None
            assert updated2["score"] is None

    anyio.run(_run)


def test_list_risks_includes_created_item(app_overridden, db_session, auth_headers):
    app = app_overridden

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Create one risk
            resp = await client.post(
                "/risks",
                json={"risk_name": "Data Loss", "probability": 2, "impact": 5, "scope": "project", "status": "open"},
                headers=auth_headers,
            )
            assert resp.status_code == 201

            # List risks
            lst = await client.get("/risks", headers=auth_headers)
            assert lst.status_code == 200
            items = lst.json()
            assert isinstance(items, list)
            assert any(r["risk_name"] == "Data Loss" for r in items)

    anyio.run(_run)

