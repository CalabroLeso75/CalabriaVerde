"""external collaboration profiles

Revision ID: 005_external_collaboration_profiles
Revises: 004_geography_module
Create Date: 2026-05-14 17:45:00
"""
from alembic import op
import sqlalchemy as sa


revision = "005_external_collaboration_profiles"
down_revision = "004_geography_module"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("tipo_collaborazione", sa.String(length=100), nullable=True))
    op.create_index("ix_employees_tipo_collaborazione", "employees", ["tipo_collaborazione"])


def downgrade() -> None:
    op.drop_index("ix_employees_tipo_collaborazione", table_name="employees")
    op.drop_column("employees", "tipo_collaborazione")
