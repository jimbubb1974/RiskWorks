"""add_audit_log_table

Revision ID: 98b1305782d2
Revises: 7aa339374e45
Create Date: 2025-09-13 14:33:23.091661

"""
from alembic import op
import sqlalchemy as sa

revision = '98b1305782d2'
down_revision = '7aa339374e45'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# Create audit_logs table
	op.create_table('audit_logs',
		sa.Column('id', sa.Integer(), nullable=False),
		sa.Column('entity_type', sa.String(length=50), nullable=False),
		sa.Column('entity_id', sa.Integer(), nullable=False),
		sa.Column('user_id', sa.Integer(), nullable=False),
		sa.Column('action', sa.String(length=50), nullable=False),
		sa.Column('changes', sa.JSON(), nullable=True),
		sa.Column('description', sa.Text(), nullable=True),
		sa.Column('ip_address', sa.String(length=45), nullable=True),
		sa.Column('user_agent', sa.Text(), nullable=True),
		sa.Column('timestamp', sa.DateTime(), nullable=False),
		sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
		sa.PrimaryKeyConstraint('id')
	)
	op.create_index(op.f('ix_audit_logs_entity_id'), 'audit_logs', ['entity_id'], unique=False)
	op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
	op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)


def downgrade() -> None:
	# Drop audit_logs table
	op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
	op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
	op.drop_index(op.f('ix_audit_logs_entity_id'), table_name='audit_logs')
	op.drop_table('audit_logs')


