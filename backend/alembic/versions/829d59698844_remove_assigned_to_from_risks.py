"""remove_assigned_to_from_risks

Revision ID: 829d59698844
Revises: 059b51de53ee
Create Date: 2025-09-11 21:03:05.461801

"""
from alembic import op
import sqlalchemy as sa

revision = '829d59698844'
down_revision = '059b51de53ee'
branch_labels = None
depends_on = None


def upgrade() -> None:
	op.drop_column('risks', 'assigned_to')


def downgrade() -> None:
	op.add_column('risks', sa.Column('assigned_to', sa.Integer(), nullable=True))


