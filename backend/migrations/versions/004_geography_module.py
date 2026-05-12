"""geography module

Revision ID: 004_geography_module
Revises: 003_admin_contract_types
Create Date: 2026-05-13 00:30:00
"""
from alembic import op
import sqlalchemy as sa


revision = "004_geography_module"
down_revision = "003_admin_contract_types"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "geo_countries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("iso2", sa.String(length=3), nullable=True),
        sa.Column("cadastral_code", sa.String(length=4), nullable=True),
        sa.Column("slug", sa.String(length=200), nullable=True),
        sa.Column("valid_from", sa.Date(), nullable=True),
        sa.Column("valid_to", sa.Date(), nullable=True),
        sa.Column("is_italy", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("slug", name="uq_geo_countries_slug"),
    )
    op.create_index("ix_geo_countries_name", "geo_countries", ["name"])
    op.create_index("ix_geo_countries_iso2", "geo_countries", ["iso2"])
    op.create_index("ix_geo_countries_cadastral_code", "geo_countries", ["cadastral_code"])

    op.create_table(
        "geo_regions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("country_id", sa.Integer(), sa.ForeignKey("geo_countries.id"), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_geo_regions_country_id", "geo_regions", ["country_id"])
    op.create_index("ix_geo_regions_source_id", "geo_regions", ["source_id"])
    op.create_index("ix_geo_regions_name", "geo_regions", ["name"])
    op.create_index("ix_geo_regions_code", "geo_regions", ["code"])

    op.create_table(
        "geo_provinces",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("geo_regions.id"), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=True),
        sa.Column("istat_code", sa.String(length=10), nullable=True),
        sa.Column("vehicle_code", sa.String(length=10), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_geo_provinces_region_id", "geo_provinces", ["region_id"])
    op.create_index("ix_geo_provinces_source_id", "geo_provinces", ["source_id"])
    op.create_index("ix_geo_provinces_name", "geo_provinces", ["name"])
    op.create_index("ix_geo_provinces_code", "geo_provinces", ["code"])
    op.create_index("ix_geo_provinces_istat_code", "geo_provinces", ["istat_code"])

    op.create_table(
        "geo_municipalities",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("province_id", sa.Integer(), sa.ForeignKey("geo_provinces.id"), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=190), nullable=False),
        sa.Column("istat_code", sa.String(length=10), nullable=True),
        sa.Column("cadastral_code", sa.String(length=10), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=True),
        sa.Column("valid_from", sa.Date(), nullable=True),
        sa.Column("valid_to", sa.Date(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_geo_municipalities_province_id", "geo_municipalities", ["province_id"])
    op.create_index("ix_geo_municipalities_source_id", "geo_municipalities", ["source_id"])
    op.create_index("ix_geo_municipalities_name", "geo_municipalities", ["name"])
    op.create_index("ix_geo_municipalities_istat_code", "geo_municipalities", ["istat_code"])
    op.create_index("ix_geo_municipalities_cadastral_code", "geo_municipalities", ["cadastral_code"])
    op.create_index("ix_geo_municipalities_status", "geo_municipalities", ["status"])

    op.create_table(
        "geo_province_boundaries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("province_id", sa.Integer(), sa.ForeignKey("geo_provinces.id"), nullable=False),
        sa.Column("source_name", sa.String(length=150), nullable=True),
        sa.Column("geometry_geojson", sa.Text(), nullable=True),
        sa.Column("centroid_latitude", sa.Float(), nullable=True),
        sa.Column("centroid_longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("province_id", name="uq_geo_province_boundaries_province_id"),
    )
    op.create_index("ix_geo_province_boundaries_province_id", "geo_province_boundaries", ["province_id"])

    op.create_table(
        "geo_municipality_boundaries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("municipality_id", sa.Integer(), sa.ForeignKey("geo_municipalities.id"), nullable=False),
        sa.Column("source_name", sa.String(length=150), nullable=True),
        sa.Column("geometry_geojson", sa.Text(), nullable=True),
        sa.Column("centroid_latitude", sa.Float(), nullable=True),
        sa.Column("centroid_longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("municipality_id", name="uq_geo_municipality_boundaries_municipality_id"),
    )
    op.create_index("ix_geo_municipality_boundaries_municipality_id", "geo_municipality_boundaries", ["municipality_id"])

    op.create_table(
        "geo_calabria_toponyms",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("province_id", sa.Integer(), sa.ForeignKey("geo_provinces.id"), nullable=True),
        sa.Column("municipality_id", sa.Integer(), sa.ForeignKey("geo_municipalities.id"), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("normalized_name", sa.String(length=200), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("source_name", sa.String(length=150), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_geo_calabria_toponyms_province_id", "geo_calabria_toponyms", ["province_id"])
    op.create_index("ix_geo_calabria_toponyms_municipality_id", "geo_calabria_toponyms", ["municipality_id"])
    op.create_index("ix_geo_calabria_toponyms_name", "geo_calabria_toponyms", ["name"])
    op.create_index("ix_geo_calabria_toponyms_normalized_name", "geo_calabria_toponyms", ["normalized_name"])


def downgrade() -> None:
    op.drop_index("ix_geo_calabria_toponyms_normalized_name", table_name="geo_calabria_toponyms")
    op.drop_index("ix_geo_calabria_toponyms_name", table_name="geo_calabria_toponyms")
    op.drop_index("ix_geo_calabria_toponyms_municipality_id", table_name="geo_calabria_toponyms")
    op.drop_index("ix_geo_calabria_toponyms_province_id", table_name="geo_calabria_toponyms")
    op.drop_table("geo_calabria_toponyms")

    op.drop_index("ix_geo_municipality_boundaries_municipality_id", table_name="geo_municipality_boundaries")
    op.drop_table("geo_municipality_boundaries")

    op.drop_index("ix_geo_province_boundaries_province_id", table_name="geo_province_boundaries")
    op.drop_table("geo_province_boundaries")

    op.drop_index("ix_geo_municipalities_status", table_name="geo_municipalities")
    op.drop_index("ix_geo_municipalities_cadastral_code", table_name="geo_municipalities")
    op.drop_index("ix_geo_municipalities_istat_code", table_name="geo_municipalities")
    op.drop_index("ix_geo_municipalities_name", table_name="geo_municipalities")
    op.drop_index("ix_geo_municipalities_source_id", table_name="geo_municipalities")
    op.drop_index("ix_geo_municipalities_province_id", table_name="geo_municipalities")
    op.drop_table("geo_municipalities")

    op.drop_index("ix_geo_provinces_istat_code", table_name="geo_provinces")
    op.drop_index("ix_geo_provinces_code", table_name="geo_provinces")
    op.drop_index("ix_geo_provinces_name", table_name="geo_provinces")
    op.drop_index("ix_geo_provinces_source_id", table_name="geo_provinces")
    op.drop_index("ix_geo_provinces_region_id", table_name="geo_provinces")
    op.drop_table("geo_provinces")

    op.drop_index("ix_geo_regions_code", table_name="geo_regions")
    op.drop_index("ix_geo_regions_name", table_name="geo_regions")
    op.drop_index("ix_geo_regions_source_id", table_name="geo_regions")
    op.drop_index("ix_geo_regions_country_id", table_name="geo_regions")
    op.drop_table("geo_regions")

    op.drop_index("ix_geo_countries_cadastral_code", table_name="geo_countries")
    op.drop_index("ix_geo_countries_iso2", table_name="geo_countries")
    op.drop_index("ix_geo_countries_name", table_name="geo_countries")
    op.drop_table("geo_countries")
