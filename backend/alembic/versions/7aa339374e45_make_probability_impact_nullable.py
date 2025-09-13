"""make_probability_impact_nullable

Revision ID: 7aa339374e45
Revises: 1578fef50c08
Create Date: 2025-09-13 14:17:28.146619

"""
from alembic import op
import sqlalchemy as sa

revision = '7aa339374e45'
down_revision = '1578fef50c08'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Make probability and impact fields nullable
	op.alter_column('risks', 'probability', nullable=True)
	op.alter_column('risks', 'impact', nullable=True)


def downgrade() -> None:
	# Make probability and impact fields non-nullable again
	op.alter_column('risks', 'probability', nullable=False)
	op.alter_column('risks', 'impact', nullable=False)


