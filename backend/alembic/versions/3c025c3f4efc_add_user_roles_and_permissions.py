"""Add user roles and permissions

Revision ID: 3c025c3f4efc
Revises: 9a722c790bba
Create Date: 2025-09-08 12:41:10.607468

"""
from alembic import op
import sqlalchemy as sa

revision = '3c025c3f4efc'
down_revision = '9a722c790bba'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Add role and status columns
	op.add_column('users', sa.Column('role', sa.String(length=50), nullable=False, server_default='user'))
	op.add_column('users', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))
	op.add_column('users', sa.Column('permissions', sa.String(length=1000), nullable=True))
	
	# Remove server defaults after adding columns
	op.alter_column('users', 'role', server_default=None)
	op.alter_column('users', 'status', server_default=None)


def downgrade() -> None:
	# Remove the columns
	op.drop_column('users', 'permissions')
	op.drop_column('users', 'status')
	op.drop_column('users', 'role')


