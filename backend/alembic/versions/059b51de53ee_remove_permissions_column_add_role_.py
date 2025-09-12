"""remove_permissions_column_add_role_based_permissions

Revision ID: 059b51de53ee
Revises: 03d6bdb2c4d1
Create Date: 2025-09-11 19:55:37.593482

"""
from alembic import op
import sqlalchemy as sa

revision = '059b51de53ee'
down_revision = '03d6bdb2c4d1'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Remove the permissions column from users table
	op.drop_column('users', 'permissions')
	
	# Update existing users to have valid roles
	# Change any invalid roles to 'viewer'
	op.execute("""
		UPDATE users 
		SET role = 'viewer' 
		WHERE role NOT IN ('viewer', 'editor', 'manager')
	""")


def downgrade() -> None:
	# Add the permissions column back to users table
	op.add_column('users', sa.Column('permissions', sa.String(1000), nullable=True))


