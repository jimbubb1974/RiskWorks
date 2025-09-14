"""promote specified admin emails to manager

Revision ID: 66_promote_admins
Revises: 65ee78afa262
Create Date: 2025-09-14
"""

from alembic import op
import os

# revision identifiers, used by Alembic.
revision = '66_promote_admins'
down_revision = '65ee78afa262'
branch_labels = None
depends_on = None


def upgrade() -> None:
    emails = os.environ.get("ADMIN_EMAILS", "").strip()
    if not emails:
        # Backward-compatible default if env not provided; change as needed
        emails = os.environ.get("ADMIN_EMAIL", "").strip()

    if not emails:
        return

    items = [e.strip() for e in emails.split(",") if e.strip()]
    if not items:
        return

    # Build a safe, quoted list for SQL IN clause
    quoted = ", ".join([f"'{e.replace("'", "''")}'" for e in items])
    op.execute(
        f"UPDATE users SET role='manager', is_active=TRUE WHERE email IN ({quoted});"
    )


def downgrade() -> None:
    # No automatic downgrade for role changes
    pass


