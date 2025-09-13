"""add scope to risks

Revision ID: c6a9d3f1a2b7
Revises: 8a51d3c6c2f0
Create Date: 2025-09-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c6a9d3f1a2b7"
down_revision = "8a51d3c6c2f0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add scope column with default to backfill existing rows, then drop server_default
    op.add_column(
        "risks",
        sa.Column("scope", sa.String(length=32), nullable=False, server_default="project"),
    )
    # Remove the server default to match application behavior
    op.alter_column("risks", "scope", server_default=None)


def downgrade() -> None:
    op.drop_column("risks", "scope")


