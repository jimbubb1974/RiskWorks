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


def seed_risks(client: httpx.AsyncClient, headers: dict[str, str]):
    async def _seed():
        # name, prob, imp, status
        data = [
            ("Alpha latency", 1, 5, "open"),
            ("Beta outage", 5, 5, "in_progress"),
            ("Gamma fraud", 2, 4, "open"),
            ("Delta drift", 3, 1, "mitigated"),
            ("Epsilon leak", 4, 2, "closed"),
        ]
        for name, p, i, st in data:
            resp = await client.post(
                "/risks",
                json={"risk_name": name, "probability": p, "impact": i, "scope": "project", "status": st},
                headers=\
headers,
            )
            assert resp.status_code == 201, resp.text
    return _seed()


def ids(items):
    return [r["id"] for r in items]


def names(items):
    return [r["risk_name"] for r in items]


def scores(items):
    return [r["score"] for r in items]


def test_sort_filter_pagination(app_overridden, db_session):
    app = app_overridden
    manager = make_auth_header(db_session, "listtester@example.com", "manager")

    async def _run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
            # Seed data
            await seed_risks(client, manager)

            # Sort by score desc (default should already be created_at desc, so enforce)
            r = await client.get("/risks", params={"sort_by": "score", "order": "desc"}, headers=manager)
            assert r.status_code == 200
            lst = r.json()
            sc = scores(lst)
            assert sc == sorted(sc, reverse=True)

            # Sort by score asc
            r2 = await client.get("/risks", params={"sort_by": "score", "order": "asc"}, headers=manager)
            assert r2.status_code == 200
            lst2 = r2.json()
            sc2 = scores(lst2)
            assert sc2 == sorted(sc2)

            # Filter min_probability (min_likelihood backward compat) and min_impact
            r3 = await client.get("/risks", params={"min_probability": 3, "min_impact": 3}, headers=manager)
            assert r3.status_code == 200
            lst3 = r3.json()
            assert all((r.get("probability") or 0) >= 3 and (r.get("impact") or 0) >= 3 for r in lst3)

            # Status filter
            r4 = await client.get("/risks", params={"status": "open"}, headers=manager)
            assert r4.status_code == 200
            lst4 = r4.json()
            assert all(r["status"] == "open" for r in lst4)

            # Search filter (case-insensitive contains)
            r5 = await client.get("/risks", params={"search": "outage"}, headers=manager)
            assert r5.status_code == 200
            lst5 = r5.json()
            assert all("outage" in r["risk_name"].lower() for r in lst5)

            # Pagination: limit 2, offset 2 on score desc ordering
            r6a = await client.get("/risks", params={"sort_by": "score", "order": "desc", "limit": 2, "offset": 0}, headers=manager)
            r6b = await client.get("/risks", params={"sort_by": "score", "order": "desc", "limit": 2, "offset": 2}, headers=manager)
            assert r6a.status_code == 200 and r6b.status_code == 200
            page1 = r6a.json()
            page2 = r6b.json()
            # Ensure no overlap between pages
            assert set(ids(page1)).isdisjoint(set(ids(page2)))

    anyio.run(_run)


