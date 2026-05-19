"""fleet insurance provider fields

Revision ID: 014_fleet_insurance_provider_fields
Revises: 013_fleet_plate_provider_snapshots
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa


revision = "014_fleet_insurance_provider_fields"
down_revision = "013_fleet_plate_provider_snapshots"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vehicle_insurance_records", sa.Column("data_scadenza_provider", sa.Date(), nullable=True))
    op.add_column("vehicle_insurance_records", sa.Column("tolleranza_giorni", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("vehicle_insurance_records", sa.Column("provider_payload", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("vehicle_insurance_records", "provider_payload")
    op.drop_column("vehicle_insurance_records", "tolleranza_giorni")
    op.drop_column("vehicle_insurance_records", "data_scadenza_provider")
