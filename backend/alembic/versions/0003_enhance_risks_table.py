"""enhance risks table

Revision ID: 0003
Revises: 0002
Create Date: 2025-09-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to risks table
    op.add_column("risks", sa.Column("likelihood", sa.Integer(), nullable=True))
    op.add_column("risks", sa.Column("impact", sa.Integer(), nullable=True))
    op.add_column("risks", sa.Column("category", sa.String(length=50), nullable=True))
    op.add_column("risks", sa.Column("risk_owner", sa.String(length=100), nullable=True))
    op.add_column("risks", sa.Column("department", sa.String(length=100), nullable=True))
    op.add_column("risks", sa.Column("location", sa.String(length=100), nullable=True))
    op.add_column("risks", sa.Column("root_cause", sa.Text(), nullable=True))
    op.add_column("risks", sa.Column("mitigation_strategy", sa.Text(), nullable=True))
    op.add_column("risks", sa.Column("contingency_plan", sa.Text(), nullable=True))
    op.add_column("risks", sa.Column("target_date", sa.DateTime(), nullable=True))
    op.add_column("risks", sa.Column("review_date", sa.DateTime(), nullable=True))
    op.add_column("risks", sa.Column("assigned_to", sa.Integer(), nullable=True))
    
    # Create index for assigned_to
    op.create_index(op.f("ix_risks_assigned_to"), "risks", ["assigned_to"], unique=False)
    
    # Update existing records to set default values
    op.execute("UPDATE risks SET likelihood = severity, impact = probability WHERE likelihood IS NULL")
    op.execute("UPDATE risks SET category = 'operational' WHERE category IS NULL")
    op.execute("UPDATE risks SET risk_owner = 'Unassigned' WHERE risk_owner IS NULL")
    op.execute("UPDATE risks SET department = 'General' WHERE department IS NULL")
    op.execute("UPDATE risks SET location = 'Unspecified' WHERE location IS NULL")
    
    # Note: SQLite doesn't support ALTER COLUMN for changing nullability
    # The columns will remain nullable but have default values set
    # This is acceptable for SQLite and won't affect functionality


def downgrade() -> None:
    # Remove new columns
    op.drop_index(op.f("ix_risks_assigned_to"), table_name="risks")
    op.drop_column("risks", "assigned_to")
    op.drop_column("risks", "review_date")
    op.drop_column("risks", "target_date")
    op.drop_column("risks", "contingency_plan")
    op.drop_column("risks", "mitigation_strategy")
    op.drop_column("risks", "root_cause")
    op.drop_column("risks", "location")
    op.drop_column("risks", "department")
    op.drop_column("risks", "risk_owner")
    op.drop_column("risks", "category")
    op.drop_column("risks", "impact")
    op.drop_column("risks", "likelihood")
