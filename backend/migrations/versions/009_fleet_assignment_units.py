"""fleet assignment units

Revision ID: 009_fleet_assignment_units
Revises: 008_fleet_ops_comms
Create Date: 2026-05-15 13:15:00
"""

from alembic import op
import sqlalchemy as sa


revision = "009_fleet_assignment_units"
down_revision = "008_fleet_ops_comms"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vehicle_logs", sa.Column("organization_id", sa.Integer(), nullable=True))
    op.create_index("ix_vehicle_logs_organization_id", "vehicle_logs", ["organization_id"])
    op.create_foreign_key(
        "fk_vehicle_logs_organization_id_organizations",
        "vehicle_logs",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_vehicle_logs_organization_id_organizations", "vehicle_logs", type_="foreignkey")
    op.drop_index("ix_vehicle_logs_organization_id", table_name="vehicle_logs")
    op.drop_column("vehicle_logs", "organization_id")
