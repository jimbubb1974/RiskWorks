"""remove category field from risks

Revision ID: 1578fef50c08
Revises: c6a9d3f1a2b7
Create Date: 2025-09-13 08:58:32.991965

"""
from alembic import op
import sqlalchemy as sa

revision = '1578fef50c08'
down_revision = 'c6a9d3f1a2b7'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Remove category column from risks table
	op.drop_column('risks', 'category')


def downgrade() -> None:
	# Add category column back to risks table
	op.add_column('risks', sa.Column('category', sa.String(50), nullable=True))


