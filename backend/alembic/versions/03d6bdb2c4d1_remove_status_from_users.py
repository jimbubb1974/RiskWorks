"""remove_status_from_users

Revision ID: 03d6bdb2c4d1
Revises: 3c025c3f4efc
Create Date: 2025-09-11 19:08:05.559413

"""
from alembic import op
import sqlalchemy as sa

revision = '03d6bdb2c4d1'
down_revision = '3c025c3f4efc'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Remove the status column from users table
	op.drop_column('users', 'status')


def downgrade() -> None:
	# Add the status column back to users table
	op.add_column('users', sa.Column('status', sa.String(20), nullable=False, server_default='active'))


