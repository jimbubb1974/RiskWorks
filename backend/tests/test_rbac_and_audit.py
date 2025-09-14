import os
import tempfile
from typing import Generator

import anyio
import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.database import Base, get_db
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
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
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
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return app


def make_auth_header(db_session, email: str, role: str) -> dict[str, str]:
    user = register_user(db_session, email=email, password="pass123", role=role)
    token = create_user_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def test_rbac_on_risks_viewer_blocked_manager_allowed(app_overridden, db_session):
    app = app_overridden

    viewer = make_auth_header(db_session, "viewer@example.com", "viewer")
    manager = make_auth_header(db_session, "manager@example.com", "manager")

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Viewer tries to create risk -> 403
            resp = await client.post("/risks", json={"risk_name": "RBAC Test"}, headers=viewer)
            assert resp.status_code == 403

            # Manager can create
            resp2 = await client.post(
                "/risks",
                json={"risk_name": "RBAC Test", "probability": 2, "impact": 2, "scope": "project", "status": "open"},
                headers=manager,
            )
            assert resp2.status_code == 201

            risk_id = resp2.json()["id"]

            # Viewer cannot update
            upd = await client.put(f"/risks/{risk_id}", json={"probability": 4}, headers=viewer)
            assert upd.status_code in (403, 404)  # 403 preferred; 404 if ownership rules apply

            # Manager can update
            upd2 = await client.put(f"/risks/{risk_id}", json={"probability": 4}, headers=manager)
            assert upd2.status_code == 200

    anyio.run(_run)


def test_action_item_permissions(app_overridden, db_session):
    app = app_overridden

    viewer = make_auth_header(db_session, "viewer2@example.com", "viewer")
    manager = make_auth_header(db_session, "manager2@example.com", "manager")

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Create a risk as manager to attach action items
            r = await client.post(
                "/risks",
                json={"risk_name": "Action Item RBAC", "probability": 2, "impact": 3, "scope": "project", "status": "open"},
                headers=manager,
            )
            assert r.status_code == 201
            risk_id = r.json()["id"]

            # Viewer cannot create action item
            ai_body = {"title": "Write runbook", "risk_id": risk_id, "status": "pending"}
            v_create = await client.post("/action-items/", json=ai_body, headers=viewer)
            assert v_create.status_code == 403

            # Manager can create
            m_create = await client.post("/action-items/", json=ai_body, headers=manager)
            assert m_create.status_code == 201
            action_id = m_create.json()["id"]

            # Viewer cannot update
            v_upd = await client.put(f"/action-items/{action_id}", json={"status": "in_progress"}, headers=viewer)
            assert v_upd.status_code == 403

            # Manager can update
            m_upd = await client.put(f"/action-items/{action_id}", json={"status": "in_progress"}, headers=manager)
            assert m_upd.status_code == 200

            # Viewer cannot delete
            v_del = await client.delete(f"/action-items/{action_id}", headers=viewer)
            assert v_del.status_code == 403

            # Manager can delete
            m_del = await client.delete(f"/action-items/{action_id}", headers=manager)
            assert m_del.status_code == 204

    anyio.run(_run)


def test_risk_audit_logging_on_create_update(app_overridden, db_session):
    app = app_overridden

    manager = make_auth_header(db_session, "auditor@example.com", "manager")

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Create risk
            resp = await client.post(
                "/risks",
                json={"risk_name": "Audit Trail Risk", "probability": 2, "impact": 2, "scope": "project", "status": "open"},
                headers=manager,
            )
            assert resp.status_code == 201
            risk_id = resp.json()["id"]

            # Update risk
            upd = await client.put(f"/risks/{risk_id}", json={"probability": 5}, headers=manager)
            assert upd.status_code == 200

            # Fetch audit trail for this risk (managers allowed)
            trail = await client.get(f"/audit/risks/{risk_id}/trail", headers=manager)
            assert trail.status_code == 200
            logs = trail.json()

            # Expect at least two events: create and update
            actions = [e["action"] for e in logs]
            assert "create" in actions
            assert "update" in actions

    anyio.run(_run)


