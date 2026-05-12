from typing import Optional
from datetime import date, datetime

from pydantic import BaseModel, Field


class GeoSummaryResponse(BaseModel):
    countries: int
    regions: int
    provinces: int
    municipalities: int
    province_boundaries: int
    municipality_boundaries: int
    calabria_toponyms: int


class GeoCountryResponse(BaseModel):
    id: int
    name: str
    iso2: Optional[str] = None
    cadastral_code: Optional[str] = None
    slug: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    is_italy: bool = False
    is_active: bool = True

    class Config:
        from_attributes = True


class GeoRegionResponse(BaseModel):
    id: int
    country_id: int
    source_id: Optional[int] = None
    name: str
    code: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class GeoProvinceResponse(BaseModel):
    id: int
    region_id: int
    source_id: Optional[int] = None
    name: str
    code: Optional[str] = None
    istat_code: Optional[str] = None
    vehicle_code: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class GeoMunicipalityResponse(BaseModel):
    id: int
    province_id: int
    source_id: Optional[int] = None
    name: str
    istat_code: Optional[str] = None
    cadastral_code: Optional[str] = None
    status: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class GeoProvinceBoundaryResponse(BaseModel):
    id: int
    province_id: int
    source_name: Optional[str] = None
    geometry_geojson: Optional[str] = None
    centroid_latitude: Optional[float] = None
    centroid_longitude: Optional[float] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GeoMunicipalityBoundaryResponse(BaseModel):
    id: int
    municipality_id: int
    source_name: Optional[str] = None
    geometry_geojson: Optional[str] = None
    centroid_latitude: Optional[float] = None
    centroid_longitude: Optional[float] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GeoToponymResponse(BaseModel):
    id: int
    province_id: Optional[int] = None
    municipality_id: Optional[int] = None
    name: str
    normalized_name: Optional[str] = None
    latitude: float
    longitude: float
    source_name: Optional[str] = None
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GeoPaginatedResponse(BaseModel):
    items: list
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    pages: int = Field(ge=0)
