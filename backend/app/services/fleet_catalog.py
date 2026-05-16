"""Catalogo tecnico mezzi e data aggregation.

Il servizio riduce chiamate esterne e duplicazioni: cerca sempre prima nel DB
locale, normalizza le chiavi tecniche e salva ogni dato remoto prima di creare
il mezzo fisico.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote
from urllib.request import urlopen

from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Vehicle, VehicleBrand, VehicleModel, VehicleTrim


ENGINE_VALUES = {"Diesel", "Petrol", "Electric", "Hybrid", "Plug-in", "CNG"}
CATEGORY_VALUES = {"Car", "Light_Commercial", "Heavy_Duty", "Motorcycle"}
STATUS_MAP = {
    "Active": "operativo",
    "Maintenance": "manutenzione",
    "Sold": "venduto",
}


@dataclass(frozen=True)
class TrimSpec:
    brand_name: str
    model_name: str
    vehicle_category: str = "Car"
    production_year: int | None = None
    engine_type: str = "Diesel"
    displacement_cc: int | None = None
    horsepower_hp: int | None = None
    source: str = "manuale"
    raw_payload: dict[str, Any] | None = None


@dataclass(frozen=True)
class PhysicalVehicleSpec:
    license_plate: str
    vin_code: str | None = None
    status: str = "Active"
    trim_id: int | None = None
    trim: TrimSpec | None = None
    allow_external_lookup: bool = False
    km_attuali: int = 0
    organization_id: int | None = None
    vehicle_type_id: int | None = None
    color: str | None = None
    ownership_type: str | None = None
    note: str | None = None


def normalize_catalog_key(value: str | None) -> str:
    """Normalizza stringhe catalogo evitando duplicati tipo Mercedes-Benz/mercedes benz."""
    cleaned = (value or "").strip().lower()
    cleaned = re.sub(r"[-_/]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


class FleetCatalogService:
    def __init__(self, db: Session):
        self.db = db

    def search_trims(self, query: str | None = None, limit: int = 50) -> list[VehicleTrim]:
        items = (
            self.db.query(VehicleTrim)
            .options(joinedload(VehicleTrim.model).joinedload(VehicleModel.brand))
            .join(VehicleTrim.model)
            .join(VehicleModel.brand)
        )
        if query:
            term = f"%{normalize_catalog_key(query)}%"
            raw_term = f"%{query.strip()}%"
            items = items.filter(
                (VehicleBrand.normalized_name.ilike(term))
                | (VehicleModel.normalized_name.ilike(term))
                | (VehicleBrand.name.ilike(raw_term))
                | (VehicleModel.name.ilike(raw_term))
            )
        return items.order_by(VehicleBrand.name.asc(), VehicleModel.name.asc(), VehicleTrim.production_year.desc()).limit(limit).all()

    def get_or_create_trim(self, spec: TrimSpec) -> VehicleTrim:
        brand = self._get_or_create_brand(spec.brand_name)
        model = self._get_or_create_model(brand, spec.model_name, spec.vehicle_category)
        return self._get_or_create_trim(model, spec)

    def create_physical_vehicle(self, spec: PhysicalVehicleSpec) -> tuple[Vehicle, str]:
        license_plate = self._normalize_license_plate(spec.license_plate)
        if self.db.query(Vehicle.id).filter(Vehicle.targa == license_plate).first():
            raise ValueError(f"Mezzo con targa {license_plate} gia presente")

        trim = self._resolve_trim(spec)
        brand = trim.model.brand
        model = trim.model
        vehicle = Vehicle(
            trim_id=trim.id,
            vehicle_type_id=spec.vehicle_type_id,
            organization_id=spec.organization_id,
            targa=license_plate,
            marca=brand.name,
            modello=model.name,
            tipo=model.vehicle_category,
            immatricolazione_anno=trim.production_year,
            numero_telaio=(spec.vin_code or "").strip().upper() or None,
            alimentazione=trim.engine_type,
            colore=spec.color,
            proprieta_tipo=spec.ownership_type,
            km_attuali=spec.km_attuali,
            stato=STATUS_MAP.get(spec.status, spec.status.lower()),
            note=spec.note,
        )
        self.db.add(vehicle)
        self.db.flush()
        return vehicle, trim.source

    def _resolve_trim(self, spec: PhysicalVehicleSpec) -> VehicleTrim:
        if spec.trim_id:
            trim = (
                self.db.query(VehicleTrim)
                .options(joinedload(VehicleTrim.model).joinedload(VehicleModel.brand))
                .filter(VehicleTrim.id == spec.trim_id)
                .first()
            )
            if not trim:
                raise ValueError("Allestimento tecnico non trovato")
            return trim

        if spec.trim:
            return self.get_or_create_trim(spec.trim)

        if spec.allow_external_lookup:
            remote_trim = self._lookup_external_trim(spec)
            if remote_trim:
                return self.get_or_create_trim(remote_trim)

        raise ValueError("Prima crea o seleziona un allestimento tecnico locale per il mezzo")

    def _get_or_create_brand(self, name: str) -> VehicleBrand:
        normalized = normalize_catalog_key(name)
        if not normalized:
            raise ValueError("Marca obbligatoria")
        brand = self.db.query(VehicleBrand).filter(VehicleBrand.normalized_name == normalized).first()
        if brand:
            return brand
        brand = VehicleBrand(name=" ".join(name.strip().split()), normalized_name=normalized)
        self.db.add(brand)
        self.db.flush()
        return brand

    def _get_or_create_model(self, brand: VehicleBrand, name: str, category: str) -> VehicleModel:
        normalized = normalize_catalog_key(name)
        if not normalized:
            raise ValueError("Modello obbligatorio")
        category_value = category if category in CATEGORY_VALUES else "Car"
        model = (
            self.db.query(VehicleModel)
            .filter(VehicleModel.brand_id == brand.id, VehicleModel.normalized_name == normalized)
            .first()
        )
        if model:
            return model
        model = VehicleModel(
            brand_id=brand.id,
            name=" ".join(name.strip().split()),
            normalized_name=normalized,
            vehicle_category=category_value,
        )
        self.db.add(model)
        self.db.flush()
        return model

    def _get_or_create_trim(self, model: VehicleModel, spec: TrimSpec) -> VehicleTrim:
        engine_type = spec.engine_type if spec.engine_type in ENGINE_VALUES else "Diesel"
        trim = (
            self.db.query(VehicleTrim)
            .options(joinedload(VehicleTrim.model).joinedload(VehicleModel.brand))
            .filter(
                VehicleTrim.model_id == model.id,
                VehicleTrim.production_year.is_(None) if spec.production_year is None else VehicleTrim.production_year == spec.production_year,
                VehicleTrim.engine_type == engine_type,
                VehicleTrim.displacement_cc.is_(None) if spec.displacement_cc is None else VehicleTrim.displacement_cc == spec.displacement_cc,
                VehicleTrim.horsepower_hp.is_(None) if spec.horsepower_hp is None else VehicleTrim.horsepower_hp == spec.horsepower_hp,
            )
            .first()
        )
        if trim:
            return trim
        trim = VehicleTrim(
            model_id=model.id,
            production_year=spec.production_year,
            engine_type=engine_type,
            displacement_cc=spec.displacement_cc,
            horsepower_hp=spec.horsepower_hp,
            source=spec.source,
            raw_payload=spec.raw_payload,
        )
        self.db.add(trim)
        self.db.flush()
        self.db.refresh(trim, attribute_names=["model"])
        return trim

    def _lookup_external_trim(self, spec: PhysicalVehicleSpec) -> TrimSpec | None:
        if os.getenv("FLEET_EXTERNAL_LOOKUP_ENABLED", "false").lower() != "true":
            return None
        vin = (spec.vin_code or "").strip().upper()
        if not vin:
            return None

        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{quote(vin)}?format=json"
        with urlopen(url, timeout=10) as response:  # nosec B310 - endpoint pubblico configurato e usato solo on demand
            payload = json.loads(response.read().decode("utf-8"))

        result = (payload.get("Results") or [{}])[0]
        brand = result.get("Make") or ""
        model = result.get("Model") or ""
        if not brand or not model:
            return None

        return TrimSpec(
            brand_name=brand,
            model_name=model,
            vehicle_category=self._map_body_class(result.get("VehicleType")),
            production_year=self._to_int(result.get("ModelYear")),
            engine_type=self._map_engine(result.get("FuelTypePrimary")),
            displacement_cc=self._liters_to_cc(result.get("DisplacementL")),
            horsepower_hp=self._to_int(result.get("EngineHP")),
            source="nhtsa_vin",
            raw_payload=result,
        )

    @staticmethod
    def _normalize_license_plate(value: str) -> str:
        return re.sub(r"\s+", "", (value or "").strip().upper())

    @staticmethod
    def _to_int(value: Any) -> int | None:
        try:
            if value in (None, ""):
                return None
            return int(float(value))
        except (TypeError, ValueError):
            return None

    def _liters_to_cc(self, value: Any) -> int | None:
        liters = self._to_float(value)
        return int(liters * 1000) if liters else None

    @staticmethod
    def _to_float(value: Any) -> float | None:
        try:
            if value in (None, ""):
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _map_engine(value: str | None) -> str:
        normalized = normalize_catalog_key(value)
        if "electric" in normalized:
            return "Electric"
        if "hybrid" in normalized:
            return "Hybrid"
        if "gasoline" in normalized or "petrol" in normalized:
            return "Petrol"
        if "cng" in normalized or "natural gas" in normalized:
            return "CNG"
        return "Diesel"

    @staticmethod
    def _map_body_class(value: str | None) -> str:
        normalized = normalize_catalog_key(value)
        if "motorcycle" in normalized:
            return "Motorcycle"
        if "truck" in normalized:
            return "Heavy_Duty"
        if "multipurpose" in normalized or "van" in normalized:
            return "Light_Commercial"
        return "Car"
