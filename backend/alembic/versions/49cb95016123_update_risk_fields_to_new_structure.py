"""Update risk fields to new structure

Revision ID: 49cb95016123
Revises: 0004
Create Date: 2025-09-06 20:55:54.804438

"""
from alembic import op
import sqlalchemy as sa

revision = '49cb95016123'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Add new risk fields
	op.add_column('risks', sa.Column('risk_name', sa.String(length=255), nullable=False, server_default='Untitled Risk'))
	op.add_column('risks', sa.Column('risk_description', sa.Text(), nullable=True))
	op.add_column('risks', sa.Column('latest_reviewed_date', sa.DateTime(), nullable=True))
	op.add_column('risks', sa.Column('probability_basis', sa.Text(), nullable=True))
	op.add_column('risks', sa.Column('impact_basis', sa.Text(), nullable=True))
	
	# Update existing data: copy title to risk_name and description to risk_description
	op.execute("UPDATE risks SET risk_name = COALESCE(title, 'Untitled Risk') WHERE risk_name = 'Untitled Risk'")
	op.execute("UPDATE risks SET risk_description = description WHERE description IS NOT NULL")
	
	# Make risk_name not nullable after data migration
	op.alter_column('risks', 'risk_name', nullable=False, server_default=None)


def downgrade() -> None:
	# Remove new risk fields
	op.drop_column('risks', 'impact_basis')
	op.drop_column('risks', 'probability_basis')
	op.drop_column('risks', 'latest_reviewed_date')
	op.drop_column('risks', 'risk_description')
	op.drop_column('risks', 'risk_name')


