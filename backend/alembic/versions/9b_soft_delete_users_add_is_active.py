"""add is_active to users for soft delete

Revision ID: 9b_soft_delete_users
Revises: 9a722c790bba
Create Date: 2025-09-14
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b_soft_delete_users'
down_revision = '9a722c790bba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.alter_column('users', 'is_active', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'is_active')


