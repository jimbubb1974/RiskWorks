"""merge heads to unify user soft delete

Revision ID: 65ee78afa262
Revises: 98b1305782d2, 9b_soft_delete_users
Create Date: 2025-09-14 13:33:19.690877

"""
from alembic import op
import sqlalchemy as sa

revision = '65ee78afa262'
down_revision = ('98b1305782d2', '9b_soft_delete_users')
branch_labels = None
depends_on = None


def upgrade() -> None:
	pass


def downgrade() -> None:
	pass


