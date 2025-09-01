"""create risks table

Revision ID: 0002
Revises: 0001
Create Date: 2025-09-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
	op.create_table(
		"risks",
		sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
		sa.Column("title", sa.String(length=255), nullable=False),
		sa.Column("description", sa.Text(), nullable=True),
		sa.Column("severity", sa.Integer(), nullable=False),
		sa.Column("probability", sa.Integer(), nullable=False),
		sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
		sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
		sa.Column("created_at", sa.DateTime(), nullable=False),
		sa.Column("updated_at", sa.DateTime(), nullable=False),
	)
	op.create_index("ix_risks_id", "risks", ["id"], unique=False)
	op.create_index("ix_risks_owner_id", "risks", ["owner_id"], unique=False)


def downgrade() -> None:
	op.drop_index("ix_risks_owner_id", table_name="risks")
	op.drop_index("ix_risks_id", table_name="risks")
	op.drop_table("risks")


