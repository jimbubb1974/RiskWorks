"""add rbs_node_id to risks

Revision ID: 8a51d3c6c2f0
Revises: 7f3f1c2a1a00
Create Date: 2025-09-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '8a51d3c6c2f0'
down_revision = '7f3f1c2a1a00'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('risks', sa.Column('rbs_node_id', sa.Integer(), nullable=True))
    op.create_index('ix_risks_rbs_node_id', 'risks', ['rbs_node_id'])
    op.create_foreign_key('fk_risks_rbs_node_id', 'risks', 'rbs_nodes', ['rbs_node_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_risks_rbs_node_id', 'risks', type_='foreignkey')
    op.drop_index('ix_risks_rbs_node_id', table_name='risks')
    op.drop_column('risks', 'rbs_node_id')


