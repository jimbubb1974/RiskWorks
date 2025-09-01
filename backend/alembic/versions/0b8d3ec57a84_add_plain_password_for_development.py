"""add_plain_password_for_development

Revision ID: 0b8d3ec57a84
Revises: 0003
Create Date: 2025-09-01 14:53:50.241977

"""
from alembic import op
import sqlalchemy as sa

revision = '0b8d3ec57a84'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Add plain_password column for development purposes
	op.add_column("users", sa.Column("plain_password", sa.String(length=255), nullable=True))


def downgrade() -> None:
	# Remove plain_password column
	op.drop_column("users", "plain_password")


