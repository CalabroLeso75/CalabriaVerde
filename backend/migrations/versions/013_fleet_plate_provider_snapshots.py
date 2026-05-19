"""fleet plate provider snapshots

Revision ID: 013_fleet_plate_provider_snapshots
Revises: 012_fleet_external_lookup_cache
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa


revision = "013_fleet_plate_provider_snapshots"
down_revision = "012_fleet_external_lookup_cache"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vehicle_plate_provider_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=True),
        sa.Column("trim_id", sa.Integer(), nullable=True),
        sa.Column("plate_lookup_id", sa.Integer(), nullable=True),
        sa.Column("insurance_lookup_id", sa.Integer(), nullable=True),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("license_plate", sa.String(length=20), nullable=False),
        sa.Column("normalized_license_plate", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="captured"),
        sa.Column("technical_found", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("insurance_found", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("technical_payload", sa.JSON(), nullable=True),
        sa.Column("insurance_payload", sa.JSON(), nullable=True),
        sa.Column("merged_payload", sa.JSON(), nullable=True),
        sa.Column("extracted_fields", sa.JSON(), nullable=True),
        sa.Column("insurance_company", sa.String(length=255), nullable=True),
        sa.Column("insurance_expiry", sa.String(length=40), nullable=True),
        sa.Column("is_insured", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["insurance_lookup_id"], ["vehicle_external_lookups.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["plate_lookup_id"], ["vehicle_external_lookups.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["trim_id"], ["vehicle_trims.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vehicle_plate_snapshots_vehicle_id", "vehicle_plate_provider_snapshots", ["vehicle_id"])
    op.create_index("ix_vehicle_plate_snapshots_trim_id", "vehicle_plate_provider_snapshots", ["trim_id"])
    op.create_index("ix_vehicle_plate_snapshots_plate_lookup_id", "vehicle_plate_provider_snapshots", ["plate_lookup_id"])
    op.create_index("ix_vehicle_plate_snapshots_insurance_lookup_id", "vehicle_plate_provider_snapshots", ["insurance_lookup_id"])
    op.create_index("ix_vehicle_plate_snapshots_provider", "vehicle_plate_provider_snapshots", ["provider"])
    op.create_index("ix_vehicle_plate_snapshots_license_plate", "vehicle_plate_provider_snapshots", ["license_plate"])
    op.create_index("ix_vehicle_plate_snapshots_normalized_plate", "vehicle_plate_provider_snapshots", ["normalized_license_plate"])
    op.create_index("ix_vehicle_plate_snapshots_status", "vehicle_plate_provider_snapshots", ["status"])


def downgrade() -> None:
    op.drop_index("ix_vehicle_plate_snapshots_status", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_normalized_plate", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_license_plate", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_provider", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_insurance_lookup_id", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_plate_lookup_id", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_trim_id", table_name="vehicle_plate_provider_snapshots")
    op.drop_index("ix_vehicle_plate_snapshots_vehicle_id", table_name="vehicle_plate_provider_snapshots")
    op.drop_table("vehicle_plate_provider_snapshots")
