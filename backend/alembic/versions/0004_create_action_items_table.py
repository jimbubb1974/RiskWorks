"""Create action items table

Revision ID: 0004
Revises: 0003_enhance_risks_table
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0b8d3ec57a84'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create action_items table
    op.create_table('action_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=False, default='mitigation'),
        sa.Column('priority', sa.String(length=20), nullable=False, default='medium'),
        sa.Column('status', sa.String(length=32), nullable=False, default='pending'),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('risk_id', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('completed_date', sa.DateTime(), nullable=True),
        sa.Column('progress_percentage', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['risk_id'], ['risks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_action_items_id'), 'action_items', ['id'], unique=False)
    op.create_index(op.f('ix_action_items_assigned_to'), 'action_items', ['assigned_to'], unique=False)
    op.create_index(op.f('ix_action_items_created_by'), 'action_items', ['created_by'], unique=False)
    op.create_index(op.f('ix_action_items_risk_id'), 'action_items', ['risk_id'], unique=False)


def downgrade() -> None:
    # Drop action_items table
    op.drop_index(op.f('ix_action_items_risk_id'), table_name='action_items')
    op.drop_index(op.f('ix_action_items_created_by'), table_name='action_items')
    op.drop_index(op.f('ix_action_items_assigned_to'), table_name='action_items')
    op.drop_index(op.f('ix_action_items_id'), table_name='action_items')
    op.drop_table('action_items')
