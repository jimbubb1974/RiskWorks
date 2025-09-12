"""create rbs nodes table

Revision ID: 7f3f1c2a1a00
Revises: 829d59698844
Create Date: 2025-09-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '7f3f1c2a1a00'
down_revision = '829d59698844'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'rbs_nodes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('owner_id', sa.Integer(), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('parent_id', sa.Integer(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['rbs_nodes.id'], ondelete='CASCADE'),
    )


def downgrade() -> None:
    op.drop_table('rbs_nodes')


