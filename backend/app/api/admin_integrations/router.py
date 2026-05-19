from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.config import ROOT_DIR, settings
from app.core.security import get_current_user
from app.models.user import User


router = APIRouter()
ADMIN_ROLE_CODES = {"superadmin", "admin"}


class FleetPlateIntegrationResponse(BaseModel):
    external_lookup_enabled: bool
    plate_provider: str
    plate_api_url: str
    plate_username: str
    plate_api_key_configured: bool
    plate_job_types: str
    plate_timeout_seconds: int
    vin_provider: str
    credits: int | None = None


class FleetPlateIntegrationUpdate(BaseModel):
    external_lookup_enabled: bool
    plate_provider: str = "targa_co_it"
    plate_api_url: str = "https://www.targa.co.it/api/reg.asmx"
    plate_username: str = ""
    plate_api_key: str = ""
    plate_job_types: str = "tecnici"
    plate_timeout_seconds: int = 55
    vin_provider: str = "nhtsa"


def require_admin_user(current_user: User) -> None:
    if current_user.is_superadmin:
        return
    active_codes = {
        user_role.role.code
        for user_role in current_user.roles
        if user_role.is_active and user_role.role
    }
    if active_codes.intersection(ADMIN_ROLE_CODES):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permessi insufficienti per gestire le integrazioni")


def env_path() -> Path:
    return ROOT_DIR / ".env"


def write_env_values(values: dict[str, str]) -> None:
    path = env_path()
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    seen: set[str] = set()
    output: list[str] = []
    for line in lines:
        key = line.split("=", 1)[0] if "=" in line and not line.strip().startswith("#") else None
        if key in values:
            output.append(f"{key}={values[key]}")
            seen.add(key)
        else:
            output.append(line)
    if output and output[-1].strip():
        output.append("")
    for key, value in values.items():
        if key not in seen:
            output.append(f"{key}={value}")
    path.write_text("\n".join(output).rstrip() + "\n", encoding="utf-8")


def apply_runtime_values(values: dict[str, str]) -> None:
    for key, value in values.items():
        if key == "FLEET_EXTERNAL_LOOKUP_ENABLED":
            setattr(settings, key, value.strip().lower() in {"1", "true", "yes", "on"})
        elif key == "FLEET_PLATE_TIMEOUT_SECONDS":
            setattr(settings, key, int(value))
        else:
            setattr(settings, key, value)


@router.get("/fleet-plate", response_model=FleetPlateIntegrationResponse)
async def get_fleet_plate_integration(current_user: User = Depends(get_current_user)):
    require_admin_user(current_user)
    return FleetPlateIntegrationResponse(
        external_lookup_enabled=settings.FLEET_EXTERNAL_LOOKUP_ENABLED,
        plate_provider=settings.FLEET_PLATE_PROVIDER,
        plate_api_url=settings.FLEET_PLATE_API_URL,
        plate_username=settings.FLEET_PLATE_USERNAME,
        plate_api_key_configured=bool(settings.FLEET_PLATE_API_KEY),
        plate_job_types=settings.FLEET_PLATE_JOB_TYPES,
        plate_timeout_seconds=settings.FLEET_PLATE_TIMEOUT_SECONDS,
        vin_provider=settings.FLEET_VIN_PROVIDER,
    )


@router.put("/fleet-plate", response_model=FleetPlateIntegrationResponse)
async def update_fleet_plate_integration(
    data: FleetPlateIntegrationUpdate,
    current_user: User = Depends(get_current_user),
):
    require_admin_user(current_user)
    provider = data.plate_provider.strip() or "targa_co_it"
    default_url = "https://www.targa.co.it/api/reg.asmx"
    if provider == "openapi_automotive":
        default_url = "https://automotive.openapi.com"
    elif provider == "openapi_sandbox":
        default_url = "https://test.automotive.openapi.com"
    values = {
        "FLEET_EXTERNAL_LOOKUP_ENABLED": "true" if data.external_lookup_enabled else "false",
        "FLEET_PLATE_PROVIDER": provider,
        "FLEET_PLATE_API_URL": data.plate_api_url.strip() or default_url,
        "FLEET_PLATE_USERNAME": data.plate_username.strip(),
        "FLEET_PLATE_JOB_TYPES": data.plate_job_types.strip() or "tecnici",
        "FLEET_PLATE_TIMEOUT_SECONDS": str(max(10, min(data.plate_timeout_seconds, 120))),
        "FLEET_VIN_PROVIDER": data.vin_provider.strip() or "nhtsa",
    }
    if data.plate_api_key:
        values["FLEET_PLATE_API_KEY"] = data.plate_api_key.strip()
    write_env_values(values)
    apply_runtime_values(values)
    return await get_fleet_plate_integration(current_user)
