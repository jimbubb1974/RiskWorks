"""make_title_nullable

Revision ID: 191adcd83b24
Revises: 49cb95016123
Create Date: 2025-09-06 21:24:51.887827

"""
from alembic import op
import sqlalchemy as sa

revision = '191adcd83b24'
down_revision = '49cb95016123'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Make the title field nullable to allow new risk records without legacy title
	op.alter_column('risks', 'title', nullable=True)


def downgrade() -> None:
	# Make the title field not nullable again
	op.alter_column('risks', 'title', nullable=False)


