"""add_notes_field_to_risks

Revision ID: 5c9e8a43fc00
Revises: 191adcd83b24
Create Date: 2025-09-06 22:02:22.544196

"""
from alembic import op
import sqlalchemy as sa

revision = '5c9e8a43fc00'
down_revision = '191adcd83b24'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Add notes column to risks table
	op.add_column('risks', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
	# Remove notes column from risks table
	op.drop_column('risks', 'notes')


