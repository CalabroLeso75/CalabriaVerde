"""fleet external lookup cache

Revision ID: 012_fleet_external_lookup_cache
Revises: 011_fleet_trim_technical_details
Create Date: 2026-05-16
"""

from alembic import op
import sqlalchemy as sa


revision = "012_fleet_external_lookup_cache"
down_revision = "011_fleet_trim_technical_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vehicle_external_lookups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("lookup_type", sa.String(length=40), nullable=False),
        sa.Column("lookup_key", sa.String(length=120), nullable=False),
        sa.Column("normalized_lookup_key", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="pending"),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("vehicle_id", sa.Integer(), nullable=True),
        sa.Column("trim_id", sa.Integer(), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["trim_id"], ["vehicle_trims.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vehicle_external_lookups_provider", "vehicle_external_lookups", ["provider"])
    op.create_index("ix_vehicle_external_lookups_lookup_type", "vehicle_external_lookups", ["lookup_type"])
    op.create_index("ix_vehicle_external_lookups_lookup_key", "vehicle_external_lookups", ["lookup_key"])
    op.create_index("ix_vehicle_external_lookups_normalized_lookup_key", "vehicle_external_lookups", ["normalized_lookup_key"])
    op.create_index("ix_vehicle_external_lookups_vehicle_id", "vehicle_external_lookups", ["vehicle_id"])
    op.create_index("ix_vehicle_external_lookups_trim_id", "vehicle_external_lookups", ["trim_id"])


def downgrade() -> None:
    op.drop_index("ix_vehicle_external_lookups_trim_id", table_name="vehicle_external_lookups")
    op.drop_index("ix_vehicle_external_lookups_vehicle_id", table_name="vehicle_external_lookups")
    op.drop_index("ix_vehicle_external_lookups_normalized_lookup_key", table_name="vehicle_external_lookups")
    op.drop_index("ix_vehicle_external_lookups_lookup_key", table_name="vehicle_external_lookups")
    op.drop_index("ix_vehicle_external_lookups_lookup_type", table_name="vehicle_external_lookups")
    op.drop_index("ix_vehicle_external_lookups_provider", table_name="vehicle_external_lookups")
    op.drop_table("vehicle_external_lookups")
