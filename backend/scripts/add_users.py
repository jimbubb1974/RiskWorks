#!/usr/bin/env python3
"""
Bulk add users via CLI.

Usage examples (run from backend dir in venv):

  (venv) python scripts/add_users.py --role manager alice@example.com bob@example.com

If a user already exists, it will be skipped.
Passwords are generated randomly and printed for convenience (dev only).
"""

import argparse
import secrets
import string
import sys
from pathlib import Path

# Ensure app is importable when running from scripts/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from sqlalchemy import select  # type: ignore

from app.database import get_db
from app.models.user import User
from app.services.auth import register_user


def generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def add_users(emails: list[str], role: str) -> None:
    db = next(get_db())
    try:
        created = []
        skipped = []
        for email in emails:
            existing = db.scalar(select(User).where(User.email == email))
            if existing:
                skipped.append(email)
                continue
            password = generate_password()
            user = register_user(db, email=email, password=password, role=role)
            created.append((email, password, user.id))

        if created:
            print("Created users:")
            for email, password, user_id in created:
                print(f"  - {email} (id={user_id}) password={password}")
        if skipped:
            print("Skipped existing users:")
            for email in skipped:
                print(f"  - {email}")
    finally:
        try:
            db.close()
        except Exception:
            pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Add users to RiskWorks")
    parser.add_argument("emails", nargs="+", help="Email addresses to create")
    parser.add_argument("--role", default="viewer", help="User role (viewer|editor|manager)")
    args = parser.parse_args()

    add_users(args.emails, role=args.role)


if __name__ == "__main__":
    main()


