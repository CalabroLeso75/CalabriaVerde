"""Catalogo tecnico mezzi e data aggregation.

Il servizio riduce chiamate esterne e duplicazioni: cerca sempre prima nel DB
locale, normalizza le chiavi tecniche e salva ogni dato remoto prima di creare
il mezzo fisico.
"""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
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


@dataclass(frozen=True)
class InsuranceLookupResult:
    provider: str
    lookup_key: str
    status: str
    company: str | None = None
    expiry: str | None = None
    is_insured: bool | None = None
    region: str | None = None
    raw_payload: dict[str, Any] | None = None
    error_message: str | None = None
    http_status: int | None = None


@dataclass(frozen=True)
class CatalogImportResult:
    provider: str
    imported_brands: int = 0
    imported_models: int = 0
    skipped_models: int = 0
    errors: list[str] = field(default_factory=list)


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
        plate_username = (settings.FLEET_PLATE_USERNAME or settings.FLEET_PLATE_API_KEY).strip()
        plate_uses_username = plate_provider in {"targa", "targa_co_it", "targacoit", "regcheck"}
        return [
            ProviderStatus(
                code=plate_provider or "none",
                label="Provider targa italiana",
                lookup_type="plate",
                enabled=settings.FLEET_EXTERNAL_LOOKUP_ENABLED and plate_provider not in {"", "none"},
                configured=bool(settings.FLEET_PLATE_API_URL and (plate_username if plate_uses_username else settings.FLEET_PLATE_API_KEY)),
                needs_api_key=not plate_uses_username,
                note=(
                    "Targa.co.it/RegCheck usa lo username account come credenziale API; la password serve solo per la dashboard."
                    if plate_uses_username
                    else "Usa targa per marca, modello e dati tecnici. Configurare URL e API key del provider scelto."
                ),
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

    def import_nhtsa_catalog(self, makes: list[str] | None = None, import_all_makes: bool = True) -> CatalogImportResult:
        imported_brands = 0
        imported_models = 0
        skipped_models = 0
        errors: list[str] = []
        target_makes = makes or [
            "FIAT",
            "FORD",
            "PEUGEOT",
            "CITROEN",
            "IVECO",
            "RENAULT",
            "TOYOTA",
            "NISSAN",
            "MERCEDES-BENZ",
            "VOLKSWAGEN",
            "OPEL",
            "ISUZU",
            "MITSUBISHI",
            "SUZUKI",
            "LAND ROVER",
            "HYUNDAI",
            "KIA",
            "DACIA",
            "PIAGGIO",
            "MAN",
        ]

        if import_all_makes:
            try:
                for make_name in self._fetch_nhtsa_makes():
                    before = self.db.query(VehicleBrand.id).filter(VehicleBrand.normalized_name == normalize_catalog_key(make_name)).first()
                    self._get_or_create_brand(make_name)
                    if not before:
                        imported_brands += 1
            except Exception as exc:  # noqa: BLE001 - import amministrativo, errore riportato nel risultato
                errors.append(f"Import marche NHTSA non riuscito: {exc}")

        for make_name in target_makes:
            try:
                brand = self._get_or_create_brand(make_name)
                if brand.id and not self.db.query(VehicleBrand.id).filter(
                    VehicleBrand.id == brand.id,
                    VehicleBrand.created_at != VehicleBrand.updated_at,
                ).first():
                    pass
                for model_name in self._fetch_nhtsa_models(make_name):
                    before = (
                        self.db.query(VehicleModel.id)
                        .filter(
                            VehicleModel.brand_id == brand.id,
                            VehicleModel.normalized_name == normalize_catalog_key(model_name),
                        )
                        .first()
                    )
                    self._get_or_create_model(brand, model_name, "Car")
                    if before:
                        skipped_models += 1
                    else:
                        imported_models += 1
            except Exception as exc:  # noqa: BLE001
                errors.append(f"Import modelli {make_name} non riuscito: {exc}")

        return CatalogImportResult(
            provider="nhtsa",
            imported_brands=imported_brands,
            imported_models=imported_models,
            skipped_models=skipped_models,
            errors=errors,
        )

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

    def lookup_italy_insurance(self, plate: str) -> InsuranceLookupResult:
        provider = "targa_co_it_insurance"
        username = (settings.FLEET_PLATE_USERNAME or settings.FLEET_PLATE_API_KEY).strip()
        if not settings.FLEET_EXTERNAL_LOOKUP_ENABLED or not username:
            return InsuranceLookupResult(provider=provider, lookup_key=plate, status="not_configured", error_message="Provider assicurazione targa non configurato")
        base_url = "https://www.targa.co.it/api/bespokeapi.asmx"
        url = f"{base_url}/CheckInsuranceStatusItaly?{urlencode({'regNumber': self._normalize_license_plate(plate), 'username': username})}"
        request = Request(url, headers={"Accept": "text/xml,application/xml"})
        try:
            # Il controllo assicurativo e' accessorio: non deve bloccare il flusso mezzo
            # oltre i tempi tipici del gateway.
            timeout_seconds = min(settings.FLEET_PLATE_TIMEOUT_SECONDS, 15)
            with urlopen(request, timeout=timeout_seconds) as response:  # nosec B310 - endpoint ufficiale configurato da amministratore
                response_text = response.read().decode("utf-8", errors="replace")
            payload = self._xml_to_dict(ET.fromstring(response_text))
            data = self._extract_vehicle_payload(payload)
            result = InsuranceLookupResult(
                provider=provider,
                lookup_key=plate,
                status="found" if self._pick_nested_value(data, "Company") else "empty",
                company=self._pick_nested_value(data, "Company"),
                expiry=self._pick_nested_value(data, "Expiry"),
                is_insured=self._to_bool(self._pick_nested_value(data, "IsInsured")),
                region=self._pick_nested_value(data, "Region"),
                raw_payload=payload,
                http_status=200,
            )
            self._record_external_lookup(ExternalLookupResult(
                provider=provider,
                lookup_type="insurance",
                lookup_key=plate,
                status=result.status,
                raw_payload=payload,
                http_status=200,
                error_message=result.error_message,
            ))
            return result
        except HTTPError as exc:
            result = InsuranceLookupResult(provider=provider, lookup_key=plate, status="error", error_message=str(exc), http_status=exc.code)
            self._record_external_lookup(ExternalLookupResult(provider=provider, lookup_type="insurance", lookup_key=plate, status="error", error_message=str(exc), http_status=exc.code))
            return result
        except (ET.ParseError, URLError, TimeoutError, ValueError) as exc:
            result = InsuranceLookupResult(provider=provider, lookup_key=plate, status="error", error_message=str(exc))
            self._record_external_lookup(ExternalLookupResult(provider=provider, lookup_type="insurance", lookup_key=plate, status="error", error_message=str(exc)))
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
        if provider in {"targa", "targa_co_it", "targacoit", "regcheck"}:
            return self._lookup_targa_co_it_plate(plate)
        if not settings.FLEET_PLATE_API_URL or not settings.FLEET_PLATE_API_KEY:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="not_configured", error_message="URL o API key provider targa mancanti")
        if provider == "tuttotarghe":
            return self._lookup_tuttotarghe_plate(plate)

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

    def _lookup_targa_co_it_plate(self, plate: str) -> ExternalLookupResult:
        provider = "targa_co_it"
        username = (settings.FLEET_PLATE_USERNAME or settings.FLEET_PLATE_API_KEY).strip()
        if not settings.FLEET_PLATE_API_URL or not username:
            return ExternalLookupResult(
                provider=provider,
                lookup_type="plate",
                lookup_key=plate,
                status="not_configured",
                error_message="Ricerca da targa non attiva: manca lo username Targa.co.it/RegCheck.",
            )

        base_url = settings.FLEET_PLATE_API_URL.rstrip("/")
        endpoint = base_url if base_url.endswith("/CheckItaly") else f"{base_url}/CheckItaly"
        url = f"{endpoint}?{urlencode({'RegistrationNumber': plate, 'username': username})}"
        request = Request(url, headers={"Accept": "text/xml,application/xml"})
        try:
            with urlopen(request, timeout=settings.FLEET_PLATE_TIMEOUT_SECONDS) as response:  # nosec B310 - endpoint ufficiale configurato da amministratore
                response_text = response.read().decode("utf-8", errors="replace")
            payload = self._parse_regcheck_vehicle_response(response_text)
            trim = self._trim_from_regcheck_payload(payload)
            return ExternalLookupResult(
                provider=provider,
                lookup_type="plate",
                lookup_key=plate,
                status="found" if trim else "empty",
                trim=trim,
                raw_payload=payload,
                http_status=200,
                source_notes=["Fonte Targa.co.it/RegCheck: dati salvati nel catalogo locale per ridurre richieste successive."],
            )
        except HTTPError as exc:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="error", error_message=str(exc), http_status=exc.code)
        except (ET.ParseError, URLError, TimeoutError, ValueError) as exc:
            return ExternalLookupResult(provider=provider, lookup_type="plate", lookup_key=plate, status="error", error_message=str(exc))

    def _lookup_tuttotarghe_plate(self, plate: str) -> ExternalLookupResult:
        provider = "tuttotarghe"
        job_types = [
            item.strip()
            for item in (settings.FLEET_PLATE_JOB_TYPES or "tecnici").split(",")
            if item.strip()
        ] or ["tecnici"]
        payload = {"targhe": [plate], "type": job_types}
        request = Request(
            settings.FLEET_PLATE_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.FLEET_PLATE_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=15) as response:  # nosec B310 - endpoint configurato da amministratore
                response_payload = json.loads(response.read().decode("utf-8"))
            trim = self._trim_from_generic_payload(response_payload, source="plate_tuttotarghe")
            return ExternalLookupResult(
                provider=provider,
                lookup_type="plate",
                lookup_key=plate,
                status="found" if trim else "empty",
                trim=trim,
                raw_payload=response_payload,
                http_status=200,
                source_notes=[f"Job richiesti: {', '.join(job_types)}"],
            )
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

    def _fetch_nhtsa_makes(self) -> list[str]:
        url = "https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json"
        with urlopen(url, timeout=20) as response:  # nosec B310 - fonte pubblica NHTSA
            payload = json.loads(response.read().decode("utf-8"))
        names = []
        for item in payload.get("Results") or []:
            name = item.get("Make_Name")
            if name:
                names.append(str(name).strip())
        return sorted(set(names))

    def _fetch_nhtsa_models(self, make_name: str) -> list[str]:
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/{quote(make_name)}?format=json"
        with urlopen(url, timeout=20) as response:  # nosec B310 - fonte pubblica NHTSA
            payload = json.loads(response.read().decode("utf-8"))
        names = []
        for item in payload.get("Results") or []:
            name = item.get("Model_Name")
            if name:
                names.append(str(name).strip())
        return sorted(set(names))

    def _trim_from_generic_payload(self, payload: dict[str, Any], source: str) -> TrimSpec | None:
        data = self._extract_vehicle_payload(payload)
        brand = self._pick_value(data, "brand", "make", "marca", "manufacturer", "costruttore")
        model = self._pick_value(data, "model", "modello", "vehicle_model", "versione_modello")
        if not brand or not model:
            return None
        tire_values = data.get("tires") or data.get("tire_fitments") or data.get("gomme") or data.get("pneumatici") or []
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
            vehicle_category=self._pick_value(data, "vehicle_category", "category", "categoria") or "Car",
            commercial_name=self._pick_value(data, "commercial_name", "trim", "versione", "allestimento"),
            production_year=self._to_int(self._pick_value(data, "production_year", "year", "anno", "anno_immatricolazione")),
            engine_type=self._map_engine(self._pick_value(data, "engine_type", "fuel", "alimentazione", "carburante")),
            engine_code=self._pick_value(data, "engine_code", "codice_motore"),
            displacement_cc=self._to_int(self._pick_value(data, "displacement_cc", "cilindrata", "engine_size")),
            horsepower_hp=self._to_int(self._pick_value(data, "horsepower_hp", "power_hp", "cv", "cavalli")),
            torque_nm=self._to_int(self._pick_value(data, "torque_nm", "coppia")),
            transmission=self._pick_value(data, "transmission", "cambio"),
            drive_type=self._pick_value(data, "drive_type", "trazione"),
            body_style=self._pick_value(data, "body_style", "carrozzeria"),
            doors=self._to_int(self._pick_value(data, "doors", "porte")),
            seats=self._to_int(self._pick_value(data, "seats", "posti")),
            euro_class=self._pick_value(data, "euro_class", "classe_ambientale", "classe_euro"),
            co2_g_km=self._to_int(self._pick_value(data, "co2_g_km", "co2")),
            fuel_consumption_l_100km=self._to_float(self._pick_value(data, "fuel_consumption_l_100km", "consumo")),
            wheelbase_mm=self._to_int(self._pick_value(data, "wheelbase_mm", "passo")),
            length_mm=self._to_int(self._pick_value(data, "length_mm", "lunghezza")),
            width_mm=self._to_int(self._pick_value(data, "width_mm", "larghezza")),
            height_mm=self._to_int(self._pick_value(data, "height_mm", "altezza")),
            gross_weight_kg=self._to_int(self._pick_value(data, "gross_weight_kg", "massa_complessiva")),
            tow_capacity_kg=self._to_int(self._pick_value(data, "tow_capacity_kg", "massa_rimorchiabile")),
            tire_fitments=tuple(tire_specs),
            source=source,
            raw_payload=payload,
        )

    def _trim_from_regcheck_payload(self, payload: dict[str, Any]) -> TrimSpec | None:
        data = self._extract_vehicle_payload(payload)
        brand = self._pick_nested_value(data, "MakeDescription", "CarMake", "make", "brand")
        model = self._pick_nested_value(data, "ModelDescription", "CarModel", "model")
        if not brand or not model:
            return None
        power_kw = self._to_int(self._pick_nested_value(data, "PowerKW", "Power", "KW"))
        power_hp = self._to_int(self._pick_nested_value(data, "PowerCV", "PowerHP", "CV", "horsepower_hp"))
        if not power_hp and power_kw:
            power_hp = round(power_kw * 1.34102)
        return TrimSpec(
            brand_name=str(brand),
            model_name=str(model),
            vehicle_category=self._map_body_class(self._pick_nested_value(data, "BodyStyle", "VehicleType", "vehicle_category")),
            commercial_name=self._pick_nested_value(data, "Version", "Variant", "Description"),
            production_year=self._to_int(self._pick_nested_value(data, "RegistrationYear", "Year", "ManufactureYearFrom")),
            engine_type=self._map_engine(self._pick_nested_value(data, "FuelType", "Fuel", "engine_type")),
            engine_code=self._pick_nested_value(data, "EngineCode", "EngineNumber"),
            displacement_cc=self._to_engine_cc(self._pick_nested_value(data, "EngineSize", "EngineCC", "displacement_cc")),
            horsepower_hp=power_hp,
            body_style=self._pick_nested_value(data, "BodyStyle"),
            doors=self._to_int(self._pick_nested_value(data, "NumberOfDoors", "Doors")),
            seats=self._to_int(self._pick_nested_value(data, "NumberOfSeats", "Seats")),
            co2_g_km=self._to_int(self._pick_nested_value(data, "Co2", "CO2")),
            gross_weight_kg=self._to_int(self._pick_nested_value(data, "Weight", "GrossWeight")),
            source="targa_co_it",
            raw_payload=payload,
        )

    def _parse_regcheck_vehicle_response(self, response_text: str) -> dict[str, Any]:
        root = ET.fromstring(response_text)
        json_node = self._find_xml_node(root, "vehicleJson")
        if json_node is not None and json_node.text and json_node.text.strip():
            try:
                parsed = json.loads(json_node.text)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass
        return self._xml_to_dict(root)

    def _xml_to_dict(self, node: ET.Element) -> dict[str, Any]:
        children = list(node)
        tag = self._strip_xml_namespace(node.tag)
        if not children:
            return {tag: (node.text or "").strip()}
        result: dict[str, Any] = {}
        for child in children:
            child_dict = self._xml_to_dict(child)
            for key, value in child_dict.items():
                if key in result:
                    existing = result[key]
                    if not isinstance(existing, list):
                        result[key] = [existing]
                    result[key].append(value)
                else:
                    result[key] = value
        return result

    @staticmethod
    def _find_xml_node(root: ET.Element, local_name: str) -> ET.Element | None:
        for node in root.iter():
            if FleetCatalogService._strip_xml_namespace(node.tag) == local_name:
                return node
        return None

    @staticmethod
    def _strip_xml_namespace(tag: str) -> str:
        return tag.rsplit("}", 1)[-1] if "}" in tag else tag

    def _extract_vehicle_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        candidates: list[Any] = [payload]
        for key in ("data", "result", "results", "tecnici", "technical", "vehicle", "veicolo"):
            value = payload.get(key)
            if value is not None:
                candidates.append(value)
        for value in list(candidates):
            if isinstance(value, list):
                candidates.extend(value)
            elif isinstance(value, dict):
                for nested in value.values():
                    if isinstance(nested, (dict, list)):
                        candidates.append(nested)
        for candidate in candidates:
            if isinstance(candidate, dict):
                lowered = {str(key).lower(): value for key, value in candidate.items()}
                if self._pick_value(lowered, "brand", "make", "marca") and self._pick_value(lowered, "model", "modello"):
                    return lowered
        return payload.get("data") if isinstance(payload.get("data"), dict) else payload

    @staticmethod
    def _pick_value(data: dict[str, Any], *keys: str) -> Any:
        lowered = {str(key).lower(): value for key, value in data.items()}
        for key in keys:
            value = lowered.get(key.lower())
            if value not in (None, ""):
                return value
        return None

    def _pick_nested_value(self, data: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            value = self._pick_value(data, key)
            if isinstance(value, dict):
                nested = self._pick_nested_value(value, "CurrentTextValue", "text", "value")
                if nested not in (None, ""):
                    return nested
            elif value not in (None, ""):
                return value
        return None

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

    @staticmethod
    def _to_engine_cc(value: Any) -> int | None:
        direct = FleetCatalogService._to_int(value)
        if direct and direct >= 100:
            return direct
        text = str(value or "")
        matches = re.findall(r"\d{3,5}(?:[,.]\d+)?", text)
        if not matches:
            return direct
        try:
            return int(float(matches[0].replace(",", ".")))
        except ValueError:
            return direct

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
    def _to_bool(value: Any) -> bool | None:
        if value in (None, ""):
            return None
        normalized = normalize_catalog_key(str(value))
        if normalized in {"true", "1", "yes", "si", "s"}:
            return True
        if normalized in {"false", "0", "no", "n"}:
            return False
        return None

    @staticmethod
    def _map_engine(value: str | None) -> str:
        normalized = normalize_catalog_key(value)
        if "benzina" in normalized:
            return "Petrol"
        if "metano" in normalized:
            return "CNG"
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
