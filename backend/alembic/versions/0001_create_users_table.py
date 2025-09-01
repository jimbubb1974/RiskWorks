"""create users table

Revision ID: 0001
Revises: 
Create Date: 2025-09-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
	op.create_table(
		"users",
		sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
		sa.Column("email", sa.String(length=255), nullable=False),
		sa.Column("hashed_password", sa.String(length=255), nullable=False),
		sa.Column("created_at", sa.DateTime(), nullable=False),
	)
	op.create_index("ix_users_id", "users", ["id"], unique=False)
	op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
	op.drop_index("ix_users_email", table_name="users")
	op.drop_index("ix_users_id", table_name="users")
	op.drop_table("users")


