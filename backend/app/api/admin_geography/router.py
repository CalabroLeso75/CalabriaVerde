from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.geography import (
    GeoCalabriaToponym,
    GeoCountry,
    GeoMunicipality,
    GeoMunicipalityBoundary,
    GeoProvince,
    GeoProvinceBoundary,
    GeoRegion,
)
from app.schemas.geography import (
    GeoCountryResponse,
    GeoMunicipalityBoundaryResponse,
    GeoMunicipalityResponse,
    GeoPaginatedResponse,
    GeoProvinceBoundaryResponse,
    GeoProvinceResponse,
    GeoRegionResponse,
    GeoSummaryResponse,
    GeoToponymResponse,
)

router = APIRouter()
ADMIN_ROLE_CODES = {"superadmin", "admin", "addetto_hr"}


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

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permessi insufficienti per gestire il modulo geografico",
    )


@router.get("/summary", response_model=GeoSummaryResponse)
async def get_geography_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    return GeoSummaryResponse(
        countries=db.query(func.count(GeoCountry.id)).scalar() or 0,
        regions=db.query(func.count(GeoRegion.id)).scalar() or 0,
        provinces=db.query(func.count(GeoProvince.id)).scalar() or 0,
        municipalities=db.query(func.count(GeoMunicipality.id)).scalar() or 0,
        province_boundaries=db.query(func.count(GeoProvinceBoundary.id)).scalar() or 0,
        municipality_boundaries=db.query(func.count(GeoMunicipalityBoundary.id)).scalar() or 0,
        calabria_toponyms=db.query(func.count(GeoCalabriaToponym.id)).scalar() or 0,
    )


@router.get("/countries", response_model=list[GeoCountryResponse])
async def list_countries(
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoCountry)
    if search:
        term = f"%{search}%"
        query = query.filter(GeoCountry.name.ilike(term))
    return query.order_by(GeoCountry.is_italy.desc(), GeoCountry.name).all()


@router.get("/regions", response_model=list[GeoRegionResponse])
async def list_regions(
    country_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoRegion)
    if country_id:
        query = query.filter(GeoRegion.country_id == country_id)
    if search:
        term = f"%{search}%"
        query = query.filter(GeoRegion.name.ilike(term))
    return query.order_by(GeoRegion.sort_order.asc().nullslast(), GeoRegion.name).all()


@router.get("/provinces", response_model=list[GeoProvinceResponse])
async def list_provinces(
    region_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoProvince)
    if region_id:
        query = query.filter(GeoProvince.region_id == region_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (GeoProvince.name.ilike(term)) |
            (GeoProvince.code.ilike(term))
        )
    return query.order_by(GeoProvince.name).all()


@router.get("/municipalities", response_model=GeoPaginatedResponse)
async def list_municipalities(
    province_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoMunicipality)
    if province_id:
        query = query.filter(GeoMunicipality.province_id == province_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (GeoMunicipality.name.ilike(term)) |
            (GeoMunicipality.cadastral_code.ilike(term)) |
            (GeoMunicipality.istat_code.ilike(term))
        )

    total = query.count()
    items = query.order_by(GeoMunicipality.name).offset((page - 1) * page_size).limit(page_size).all()
    return GeoPaginatedResponse(
        items=[GeoMunicipalityResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/province-boundaries", response_model=GeoPaginatedResponse)
async def list_province_boundaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoProvinceBoundary)
    total = query.count()
    items = query.order_by(GeoProvinceBoundary.id).offset((page - 1) * page_size).limit(page_size).all()
    return GeoPaginatedResponse(
        items=[GeoProvinceBoundaryResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/municipality-boundaries", response_model=GeoPaginatedResponse)
async def list_municipality_boundaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoMunicipalityBoundary)
    total = query.count()
    items = query.order_by(GeoMunicipalityBoundary.id).offset((page - 1) * page_size).limit(page_size).all()
    return GeoPaginatedResponse(
        items=[GeoMunicipalityBoundaryResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/calabria-toponyms", response_model=GeoPaginatedResponse)
async def list_calabria_toponyms(
    province_id: int | None = Query(default=None),
    municipality_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    query = db.query(GeoCalabriaToponym)
    if province_id:
        query = query.filter(GeoCalabriaToponym.province_id == province_id)
    if municipality_id:
        query = query.filter(GeoCalabriaToponym.municipality_id == municipality_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (GeoCalabriaToponym.name.ilike(term)) |
            (GeoCalabriaToponym.normalized_name.ilike(term))
        )
    total = query.count()
    items = query.order_by(GeoCalabriaToponym.name).offset((page - 1) * page_size).limit(page_size).all()
    return GeoPaginatedResponse(
        items=[GeoToponymResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )
