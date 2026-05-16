"""fleet vehicle catalog

Revision ID: 010_fleet_vehicle_catalog
Revises: 009_fleet_assignment_units
Create Date: 2026-05-16 10:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "010_fleet_vehicle_catalog"
down_revision = "009_fleet_assignment_units"
branch_labels = None
depends_on = None


vehicle_category = sa.Enum("Car", "Light_Commercial", "Heavy_Duty", "Motorcycle", name="vehicle_category")
vehicle_engine_type = sa.Enum("Diesel", "Petrol", "Electric", "Hybrid", "Plug-in", "CNG", name="vehicle_engine_type")


def upgrade() -> None:
    op.create_table(
        "vehicle_brands",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("normalized_name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_vehicle_brands_name"),
        sa.UniqueConstraint("normalized_name", name="uq_vehicle_brands_normalized_name"),
    )
    op.create_index("ix_vehicle_brands_normalized_name", "vehicle_brands", ["normalized_name"])

    op.create_table(
        "vehicle_models",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("brand_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("normalized_name", sa.String(length=160), nullable=False),
        sa.Column("vehicle_category", vehicle_category, nullable=False, server_default="Car"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["brand_id"], ["vehicle_brands.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("brand_id", "normalized_name", name="uq_vehicle_models_brand_normalized"),
    )
    op.create_index("ix_vehicle_models_brand_id", "vehicle_models", ["brand_id"])
    op.create_index("ix_vehicle_models_normalized_name", "vehicle_models", ["normalized_name"])

    op.create_table(
        "vehicle_trims",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("production_year", sa.Integer(), nullable=True),
        sa.Column("engine_type", vehicle_engine_type, nullable=False, server_default="Diesel"),
        sa.Column("displacement_cc", sa.Integer(), nullable=True),
        sa.Column("horsepower_hp", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="manuale"),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.ForeignKeyConstraint(["model_id"], ["vehicle_models.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "model_id",
            "production_year",
            "engine_type",
            "displacement_cc",
            "horsepower_hp",
            name="uq_vehicle_trims_specs",
        ),
    )
    op.create_index("ix_vehicle_trims_model_id", "vehicle_trims", ["model_id"])

    op.add_column("vehicles", sa.Column("trim_id", sa.Integer(), nullable=True))
    op.create_index("ix_vehicles_trim_id", "vehicles", ["trim_id"])

    bind = op.get_bind()
    vehicles = bind.execute(sa.text(
        """
        SELECT id, marca, modello, tipo, alimentazione, immatricolazione_anno
        FROM vehicles
        ORDER BY id
        """
    )).mappings().all()

    trim_cache: dict[tuple[str, str, int | None, str], int] = {}
    for vehicle in vehicles:
        brand_name = (vehicle["marca"] or "Non definita").strip() or "Non definita"
        model_name = (vehicle["modello"] or "Non definito").strip() or "Non definito"
        normalized_brand = _normalize(brand_name)
        normalized_model = _normalize(model_name)
        category = _category_from_tipo(vehicle["tipo"])
        engine_type = _engine_from_alimentazione(vehicle["alimentazione"])
        year = vehicle["immatricolazione_anno"]
        cache_key = (normalized_brand, normalized_model, year, engine_type)

        trim_id = trim_cache.get(cache_key)
        if trim_id is None:
            brand_id = _get_or_create_brand(bind, brand_name, normalized_brand)
            model_id = _get_or_create_model(bind, brand_id, model_name, normalized_model, category)
            trim_id = _get_or_create_trim(bind, model_id, year, engine_type)
            trim_cache[cache_key] = trim_id

        bind.execute(
            sa.text("UPDATE vehicles SET trim_id = :trim_id WHERE id = :vehicle_id"),
            {"trim_id": trim_id, "vehicle_id": vehicle["id"]},
        )

    if not vehicles:
        brand_id = _get_or_create_brand(bind, "Non definita", "non definita")
        model_id = _get_or_create_model(bind, brand_id, "Non definito", "non definito", "Car")
        _get_or_create_trim(bind, model_id, None, "Diesel")

    op.create_foreign_key(
        "fk_vehicles_trim_id_vehicle_trims",
        "vehicles",
        "vehicle_trims",
        ["trim_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("vehicles", "trim_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    op.drop_constraint("fk_vehicles_trim_id_vehicle_trims", "vehicles", type_="foreignkey")
    op.drop_index("ix_vehicles_trim_id", table_name="vehicles")
    op.drop_column("vehicles", "trim_id")
    op.drop_index("ix_vehicle_trims_model_id", table_name="vehicle_trims")
    op.drop_table("vehicle_trims")
    op.drop_index("ix_vehicle_models_normalized_name", table_name="vehicle_models")
    op.drop_index("ix_vehicle_models_brand_id", table_name="vehicle_models")
    op.drop_table("vehicle_models")
    op.drop_index("ix_vehicle_brands_normalized_name", table_name="vehicle_brands")
    op.drop_table("vehicle_brands")
    vehicle_engine_type.drop(op.get_bind(), checkfirst=True)
    vehicle_category.drop(op.get_bind(), checkfirst=True)


def _normalize(value: str) -> str:
    cleaned = " ".join((value or "").replace("-", " ").replace("_", " ").split())
    return cleaned.lower()


def _category_from_tipo(value: str | None) -> str:
    normalized = _normalize(value or "")
    if "moto" in normalized:
        return "Motorcycle"
    if "camion" in normalized or "autocarro" in normalized or "heavy" in normalized:
        return "Heavy_Duty"
    if "pickup" in normalized or "furg" in normalized or "commercial" in normalized:
        return "Light_Commercial"
    return "Car"


def _engine_from_alimentazione(value: str | None) -> str:
    normalized = _normalize(value or "")
    if "benz" in normalized or "petrol" in normalized:
        return "Petrol"
    if "elet" in normalized or "electric" in normalized:
        return "Electric"
    if "plug" in normalized:
        return "Plug-in"
    if "ibrid" in normalized or "hybrid" in normalized:
        return "Hybrid"
    if "metano" in normalized or "cng" in normalized:
        return "CNG"
    return "Diesel"


def _get_or_create_brand(bind, name: str, normalized_name: str) -> int:
    existing = bind.execute(
        sa.text("SELECT id FROM vehicle_brands WHERE normalized_name = :normalized_name"),
        {"normalized_name": normalized_name},
    ).scalar()
    if existing:
        return int(existing)
    result = bind.execute(
        sa.text("INSERT INTO vehicle_brands (name, normalized_name) VALUES (:name, :normalized_name)"),
        {"name": name, "normalized_name": normalized_name},
    )
    return int(result.lastrowid)


def _get_or_create_model(bind, brand_id: int, name: str, normalized_name: str, category: str) -> int:
    existing = bind.execute(
        sa.text(
            """
            SELECT id FROM vehicle_models
            WHERE brand_id = :brand_id AND normalized_name = :normalized_name
            """
        ),
        {"brand_id": brand_id, "normalized_name": normalized_name},
    ).scalar()
    if existing:
        return int(existing)
    result = bind.execute(
        sa.text(
            """
            INSERT INTO vehicle_models (brand_id, name, normalized_name, vehicle_category)
            VALUES (:brand_id, :name, :normalized_name, :category)
            """
        ),
        {"brand_id": brand_id, "name": name, "normalized_name": normalized_name, "category": category},
    )
    return int(result.lastrowid)


def _get_or_create_trim(bind, model_id: int, year: int | None, engine_type: str) -> int:
    existing = bind.execute(
        sa.text(
            """
            SELECT id FROM vehicle_trims
            WHERE model_id = :model_id
              AND ((production_year IS NULL AND :year IS NULL) OR production_year = :year)
              AND engine_type = :engine_type
              AND displacement_cc IS NULL
              AND horsepower_hp IS NULL
            """
        ),
        {"model_id": model_id, "year": year, "engine_type": engine_type},
    ).scalar()
    if existing:
        return int(existing)
    result = bind.execute(
        sa.text(
            """
            INSERT INTO vehicle_trims (model_id, production_year, engine_type, source)
            VALUES (:model_id, :year, :engine_type, 'legacy_import')
            """
        ),
        {"model_id": model_id, "year": year, "engine_type": engine_type},
    )
    return int(result.lastrowid)
