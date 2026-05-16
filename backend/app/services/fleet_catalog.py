"""Catalogo tecnico mezzi e data aggregation.

Il servizio riduce chiamate esterne e duplicazioni: cerca sempre prima nel DB
locale, normalizza le chiavi tecniche e salva ogni dato remoto prima di creare
il mezzo fisico.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.fleet import (
    Vehicle,
    VehicleBrand,
    VehicleExternalLookup,
    VehicleModel,
    VehicleTrim,
    VehicleTrimTireFitment,
)


ENGINE_VALUES = {"Diesel", "Petrol", "Electric", "Hybrid", "Plug-in", "CNG"}
CATEGORY_VALUES = {"Car", "Light_Commercial", "Heavy_Duty", "Motorcycle"}
STATUS_MAP = {
    "Active": "operativo",
    "Maintenance": "manutenzione",
    "Sold": "venduto",
}


@dataclass(frozen=True)
class TireFitmentSpec:
    tire_size: str
    position: str = "both"
    rim_size: str | None = None
    load_index: str | None = None
    speed_rating: str | None = None
    pressure_bar: float | None = None
    is_default: bool = False
    notes: str | None = None
    source: str = "manuale"


@dataclass(frozen=True)
class TrimSpec:
    brand_name: str
    model_name: str
    vehicle_category: str = "Car"
    commercial_name: str | None = None
    production_year: int | None = None
    engine_type: str = "Diesel"
    engine_code: str | None = None
    displacement_cc: int | None = None
    horsepower_hp: int | None = None
    torque_nm: int | None = None
    transmission: str | None = None
    drive_type: str | None = None
    body_style: str | None = None
    doors: int | None = None
    seats: int | None = None
    euro_class: str | None = None
    co2_g_km: int | None = None
    fuel_consumption_l_100km: float | None = None
    wheelbase_mm: int | None = None
    length_mm: int | None = None
    width_mm: int | None = None
    height_mm: int | None = None
    gross_weight_kg: int | None = None
    tow_capacity_kg: int | None = None
    tire_fitments: tuple[TireFitmentSpec, ...] = ()
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


@dataclass(frozen=True)
class ProviderStatus:
    code: str
    label: str
    lookup_type: str
    enabled: bool
    configured: bool
    needs_api_key: bool
    note: str


@dataclass(frozen=True)
class ExternalLookupResult:
    provider: str
    lookup_type: str
    lookup_key: str
    status: str
    trim: TrimSpec | None = None
    trim_id: int | None = None
    raw_payload: dict[str, Any] | None = None
    error_message: str | None = None
    http_status: int | None = None
    source_notes: list[str] = field(default_factory=list)


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
            .options(
                joinedload(VehicleTrim.model).joinedload(VehicleModel.brand),
                joinedload(VehicleTrim.tire_fitments),
            )
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

    def provider_statuses(self) -> list[ProviderStatus]:
        plate_provider = settings.FLEET_PLATE_PROVIDER.strip().lower()
        return [
            ProviderStatus(
                code=plate_provider or "none",
                label="Provider targa italiana",
                lookup_type="plate",
                enabled=settings.FLEET_EXTERNAL_LOOKUP_ENABLED and plate_provider not in {"", "none"},
                configured=bool(settings.FLEET_PLATE_API_URL and settings.FLEET_PLATE_API_KEY),
                needs_api_key=True,
                note="Usa targa per marca, modello, alimentazione, revisione e assicurazione quando il fornitore lo espone.",
            ),
            ProviderStatus(
                code="nhtsa",
                label="NHTSA vPIC VIN",
                lookup_type="vin",
                enabled=settings.FLEET_EXTERNAL_LOOKUP_ENABLED and settings.FLEET_VIN_PROVIDER.strip().lower() == "nhtsa",
                configured=True,
                needs_api_key=False,
                note="Fallback gratuito da VIN/telaio; copertura migliore per schemi VIN dichiarati dai costruttori.",
            ),
            ProviderStatus(
                code="wheel_size",
                label="Wheel-Size gomme e cerchi",
                lookup_type="tires",
                enabled=settings.FLEET_EXTERNAL_LOOKUP_ENABLED and bool(settings.WHEEL_SIZE_API_KEY),
                configured=bool(settings.WHEEL_SIZE_API_KEY),
                needs_api_key=True,
                note="Fonte specializzata per misure pneumatici e cerchi; si aggancia agli allestimenti gia censiti.",
            ),
        ]

    def lookup_external(self, lookup_type: str, lookup_key: str, persist: bool = True) -> ExternalLookupResult:
        normalized_type = normalize_catalog_key(lookup_type).replace(" ", "_")
        key = (lookup_key or "").strip().upper()
        if normalized_type == "plate":
            result = self._lookup_plate_provider(key)
        elif normalized_type == "vin":
            result = self._lookup_vin_provider(key)
        else:
            result = ExternalLookupResult(
                provider="none",
                lookup_type=normalized_type,
                lookup_key=key,
                status="unsupported",
                error_message="Tipo ricerca non supportato",
            )

        lookup_log = self._record_external_lookup(result)
        if persist and result.trim:
            trim = self.get_or_create_trim(result.trim)
            lookup_log.trim_id = trim.id
            result = ExternalLookupResult(
                provider=result.provider,
                lookup_type=result.lookup_type,
                lookup_key=result.lookup_key,
                status=result.status,
                trim=result.trim,
                trim_id=trim.id,
                raw_payload=result.raw_payload,
                error_message=result.error_message,
                http_status=result.http_status,
                source_notes=[*result.source_notes, f"Allestimento salvato nel catalogo locale con id {trim.id}."],
            )
        return result

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
            remote_result = self._lookup_external_trim(spec)
            if remote_result and remote_result.trim:
                return self.get_or_create_trim(remote_result.trim)

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
            self._sync_tire_fitments(trim, spec.tire_fitments)
            return trim
        trim = VehicleTrim(
            model_id=model.id,
            commercial_name=spec.commercial_name,
            production_year=spec.production_year,
            engine_type=engine_type,
            engine_code=spec.engine_code,
            displacement_cc=spec.displacement_cc,
            horsepower_hp=spec.horsepower_hp,
            torque_nm=spec.torque_nm,
            transmission=spec.transmission,
            drive_type=spec.drive_type,
            body_style=spec.body_style,
            doors=spec.doors,
            seats=spec.seats,
            euro_class=spec.euro_class,
            co2_g_km=spec.co2_g_km,
            fuel_consumption_l_100km=spec.fuel_consumption_l_100km,
            wheelbase_mm=spec.wheelbase_mm,
            length_mm=spec.length_mm,
            width_mm=spec.width_mm,
            height_mm=spec.height_mm,
            gross_weight_kg=spec.gross_weight_kg,
            tow_capacity_kg=spec.tow_capacity_kg,
            source=spec.source,
            raw_payload=spec.raw_payload,
        )
        self.db.add(trim)
        self.db.flush()
        self._sync_tire_fitments(trim, spec.tire_fitments)
        self.db.refresh(trim, attribute_names=["model"])
        return trim

    def _sync_tire_fitments(self, trim: VehicleTrim, tire_specs: tuple[TireFitmentSpec, ...]) -> None:
        existing = {
            (item.position, item.tire_size, item.rim_size or ""): item
            for item in getattr(trim, "tire_fitments", [])
        }
        for spec in tire_specs:
            tire_size = " ".join((spec.tire_size or "").strip().split())
            if not tire_size:
                continue
            position = spec.position if spec.position in {"front", "rear", "both"} else "both"
            key = (position, tire_size, spec.rim_size or "")
            item = existing.get(key)
            if item:
                item.load_index = spec.load_index
                item.speed_rating = spec.speed_rating
                item.pressure_bar = spec.pressure_bar
                item.is_default = spec.is_default
                item.notes = spec.notes
                item.source = spec.source
                continue
            self.db.add(VehicleTrimTireFitment(
                trim_id=trim.id,
                position=position,
                tire_size=tire_size,
                rim_size=spec.rim_size,
                load_index=spec.load_index,
                speed_rating=spec.speed_rating,
                pressure_bar=spec.pressure_bar,
                is_default=spec.is_default,
                notes=spec.notes,
                source=spec.source,
            ))

    def _lookup_external_trim(self, spec: PhysicalVehicleSpec) -> ExternalLookupResult | None:
        if not settings.FLEET_EXTERNAL_LOOKUP_ENABLED:
            return None
        plate = self._normalize_license_plate(spec.license_plate)
        if plate:
            plate_result = self._lookup_plate_provider(plate)
            self._record_external_lookup(plate_result)
            if plate_result.trim:
                return plate_result
        vin = (spec.vin_code or "").strip().upper()
        if not vin:
            return None
        vin_result = self._lookup_vin_provider(vin)
        self._record_external_lookup(vin_result)
        return vin_result if vin_result.trim else None

    def _lookup_plate_provider(self, plate: str) -> ExternalLookupResult:
        provider = settings.FLEET_PLATE_PROVIDER.strip().lower() or "none"
        if not settings.FLEET_EXTERNAL_LOOKUP_ENABLED:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="disabled", error_message="Ricerca esterna disattivata")
        if provider in {"", "none"}:
            return ExternalLookupResult(provider="none", lookup_type="plate", lookup_key=plate, status="not_configured", error_message="Provider targa non configurato")
        if not settings.FLEET_PLATE_API_URL or not settings.FLEET_PLATE_API_KEY:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="not_configured", error_message="URL o API key provider targa mancanti")

        url = f"{settings.FLEET_PLATE_API_URL.rstrip('/')}/{quote(plate)}"
        request = Request(url, headers={"Authorization": f"Bearer {settings.FLEET_PLATE_API_KEY}", "Accept": "application/json"})
        try:
            with urlopen(request, timeout=12) as response:  # nosec B310 - endpoint configurato da amministratore
                payload = json.loads(response.read().decode("utf-8"))
            trim = self._trim_from_generic_payload(payload, source=f"plate_{provider}")
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="found" if trim else "empty", trim=trim, raw_payload=payload, http_status=200)
        except HTTPError as exc:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="error", error_message=str(exc), http_status=exc.code)
        except (URLError, TimeoutError, ValueError) as exc:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="error", error_message=str(exc))

    def _lookup_vin_provider(self, vin: str) -> ExternalLookupResult:
        if not settings.FLEET_EXTERNAL_LOOKUP_ENABLED:
            return ExternalLookupResult(provider="nhtsa", lookup_type="vin", lookup_key=vin, status="disabled", error_message="Ricerca esterna disattivata")
        if settings.FLEET_VIN_PROVIDER.strip().lower() != "nhtsa":
            return ExternalLookupResult(provider=settings.FLEET_VIN_PROVIDER, lookup_type="vin", lookup_key=vin, status="not_configured", error_message="Provider VIN non supportato")

        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{quote(vin)}?format=json"
        try:
            with urlopen(url, timeout=10) as response:  # nosec B310 - endpoint pubblico usato solo on demand
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            return ExternalLookupResult(provider="nhtsa", lookup_type="vin", lookup_key=vin, status="error", error_message=str(exc), http_status=exc.code)
        except (URLError, TimeoutError, ValueError) as exc:
            return ExternalLookupResult(provider="nhtsa", lookup_type="vin", lookup_key=vin, status="error", error_message=str(exc))

        result = (payload.get("Results") or [{}])[0]
        brand = result.get("Make") or ""
        model = result.get("Model") or ""
        if not brand or not model:
            return ExternalLookupResult(provider="nhtsa", lookup_type="vin", lookup_key=vin, status="empty", raw_payload=payload, error_message="VIN senza marca/modello utilizzabili", http_status=200)

        trim = TrimSpec(
            brand_name=brand,
            model_name=model,
            vehicle_category=self._map_body_class(result.get("VehicleType")),
            commercial_name=result.get("Trim") or result.get("Series") or None,
            production_year=self._to_int(result.get("ModelYear")),
            engine_type=self._map_engine(result.get("FuelTypePrimary")),
            engine_code=result.get("EngineModel") or None,
            displacement_cc=self._liters_to_cc(result.get("DisplacementL")),
            horsepower_hp=self._to_int(result.get("EngineHP")),
            seats=self._to_int(result.get("SeatRows")),
            body_style=result.get("BodyClass") or None,
            source="nhtsa_vin",
            raw_payload=result,
        )
        return ExternalLookupResult(provider="nhtsa", lookup_type="vin", lookup_key=vin, status="found", trim=trim, raw_payload=payload, http_status=200)

    def _trim_from_generic_payload(self, payload: dict[str, Any], source: str) -> TrimSpec | None:
        data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        brand = data.get("brand") or data.get("make") or data.get("marca")
        model = data.get("model") or data.get("modello")
        if not brand or not model:
            return None
        tire_values = data.get("tires") or data.get("tire_fitments") or []
        tire_specs = []
        if isinstance(tire_values, list):
            for item in tire_values:
                if isinstance(item, dict) and (item.get("tire_size") or item.get("size")):
                    tire_specs.append(TireFitmentSpec(
                        tire_size=item.get("tire_size") or item.get("size"),
                        position=item.get("position") or "both",
                        rim_size=item.get("rim_size"),
                        load_index=item.get("load_index"),
                        speed_rating=item.get("speed_rating"),
                        pressure_bar=self._to_float(item.get("pressure_bar")),
                        is_default=bool(item.get("is_default", False)),
                        notes=item.get("notes"),
                        source=source,
                    ))
        return TrimSpec(
            brand_name=str(brand),
            model_name=str(model),
            vehicle_category=data.get("vehicle_category") or data.get("category") or "Car",
            commercial_name=data.get("commercial_name") or data.get("trim") or data.get("versione"),
            production_year=self._to_int(data.get("production_year") or data.get("year") or data.get("anno")),
            engine_type=self._map_engine(data.get("engine_type") or data.get("fuel") or data.get("alimentazione")),
            engine_code=data.get("engine_code"),
            displacement_cc=self._to_int(data.get("displacement_cc") or data.get("cilindrata")),
            horsepower_hp=self._to_int(data.get("horsepower_hp") or data.get("power_hp") or data.get("cv")),
            torque_nm=self._to_int(data.get("torque_nm")),
            transmission=data.get("transmission") or data.get("cambio"),
            drive_type=data.get("drive_type") or data.get("trazione"),
            body_style=data.get("body_style") or data.get("carrozzeria"),
            doors=self._to_int(data.get("doors") or data.get("porte")),
            seats=self._to_int(data.get("seats") or data.get("posti")),
            euro_class=data.get("euro_class"),
            co2_g_km=self._to_int(data.get("co2_g_km")),
            fuel_consumption_l_100km=self._to_float(data.get("fuel_consumption_l_100km")),
            wheelbase_mm=self._to_int(data.get("wheelbase_mm")),
            length_mm=self._to_int(data.get("length_mm")),
            width_mm=self._to_int(data.get("width_mm")),
            height_mm=self._to_int(data.get("height_mm")),
            gross_weight_kg=self._to_int(data.get("gross_weight_kg")),
            tow_capacity_kg=self._to_int(data.get("tow_capacity_kg")),
            tire_fitments=tuple(tire_specs),
            source=source,
            raw_payload=payload,
        )

    def _record_external_lookup(self, result: ExternalLookupResult) -> VehicleExternalLookup:
        item = VehicleExternalLookup(
            provider=result.provider,
            lookup_type=result.lookup_type,
            lookup_key=result.lookup_key,
            normalized_lookup_key=normalize_catalog_key(result.lookup_key),
            status=result.status,
            http_status=result.http_status,
            error_message=result.error_message,
            raw_payload=result.raw_payload,
        )
        self.db.add(item)
        self.db.flush()
        return item

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
