"""fleet trim technical details

Revision ID: 011_fleet_trim_technical_details
Revises: 010_fleet_vehicle_catalog
Create Date: 2026-05-16 12:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "011_fleet_trim_technical_details"
down_revision = "010_fleet_vehicle_catalog"
branch_labels = None
depends_on = None


tire_position = sa.Enum("front", "rear", "both", name="vehicle_tire_position")


def upgrade() -> None:
    op.add_column("vehicle_trims", sa.Column("commercial_name", sa.String(length=180), nullable=True))
    op.add_column("vehicle_trims", sa.Column("engine_code", sa.String(length=80), nullable=True))
    op.add_column("vehicle_trims", sa.Column("torque_nm", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("transmission", sa.String(length=80), nullable=True))
    op.add_column("vehicle_trims", sa.Column("drive_type", sa.String(length=80), nullable=True))
    op.add_column("vehicle_trims", sa.Column("body_style", sa.String(length=120), nullable=True))
    op.add_column("vehicle_trims", sa.Column("doors", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("seats", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("euro_class", sa.String(length=30), nullable=True))
    op.add_column("vehicle_trims", sa.Column("co2_g_km", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("fuel_consumption_l_100km", sa.Numeric(5, 2), nullable=True))
    op.add_column("vehicle_trims", sa.Column("wheelbase_mm", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("length_mm", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("width_mm", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("height_mm", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("gross_weight_kg", sa.Integer(), nullable=True))
    op.add_column("vehicle_trims", sa.Column("tow_capacity_kg", sa.Integer(), nullable=True))

    op.create_table(
        "vehicle_trim_tire_fitments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("trim_id", sa.Integer(), nullable=False),
        sa.Column("position", tire_position, nullable=False, server_default="both"),
        sa.Column("tire_size", sa.String(length=60), nullable=False),
        sa.Column("rim_size", sa.String(length=60), nullable=True),
        sa.Column("load_index", sa.String(length=20), nullable=True),
        sa.Column("speed_rating", sa.String(length=20), nullable=True),
        sa.Column("pressure_bar", sa.Numeric(4, 2), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="manuale"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["trim_id"], ["vehicle_trims.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vehicle_trim_tire_fitments_trim_id", "vehicle_trim_tire_fitments", ["trim_id"])


def downgrade() -> None:
    op.drop_index("ix_vehicle_trim_tire_fitments_trim_id", table_name="vehicle_trim_tire_fitments")
    op.drop_table("vehicle_trim_tire_fitments")
    tire_position.drop(op.get_bind(), checkfirst=True)
    for column in [
        "tow_capacity_kg",
        "gross_weight_kg",
        "height_mm",
        "width_mm",
        "length_mm",
        "wheelbase_mm",
        "fuel_consumption_l_100km",
        "co2_g_km",
        "euro_class",
        "seats",
        "doors",
        "body_style",
        "drive_type",
        "transmission",
        "torque_nm",
        "engine_code",
        "commercial_name",
    ]:
        op.drop_column("vehicle_trims", column)
