from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Float,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class GeoCountry(Base):
    __tablename__ = "geo_countries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    iso2 = Column(String(3), nullable=True, index=True)
    cadastral_code = Column(String(4), nullable=True, index=True)
    slug = Column(String(200), nullable=True, unique=True)
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    is_italy = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    regions = relationship("GeoRegion", back_populates="country")


class GeoRegion(Base):
    __tablename__ = "geo_regions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_id = Column(Integer, ForeignKey("geo_countries.id"), nullable=False, index=True)
    source_id = Column(Integer, nullable=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    code = Column(String(10), nullable=True, index=True)
    sort_order = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    country = relationship("GeoCountry", back_populates="regions")
    provinces = relationship("GeoProvince", back_populates="region")


class GeoProvince(Base):
    __tablename__ = "geo_provinces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    region_id = Column(Integer, ForeignKey("geo_regions.id"), nullable=False, index=True)
    source_id = Column(Integer, nullable=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    code = Column(String(10), nullable=True, index=True)
    istat_code = Column(String(10), nullable=True, index=True)
    vehicle_code = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    region = relationship("GeoRegion", back_populates="provinces")
    municipalities = relationship("GeoMunicipality", back_populates="province")
    boundary = relationship("GeoProvinceBoundary", back_populates="province", uselist=False)
    toponyms = relationship("GeoCalabriaToponym", back_populates="province")


class GeoMunicipality(Base):
    __tablename__ = "geo_municipalities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("geo_provinces.id"), nullable=False, index=True)
    source_id = Column(Integer, nullable=True, index=True)
    name = Column(String(190), nullable=False, index=True)
    istat_code = Column(String(10), nullable=True, index=True)
    cadastral_code = Column(String(10), nullable=True, index=True)
    status = Column(String(30), nullable=True, index=True)
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    province = relationship("GeoProvince", back_populates="municipalities")
    boundary = relationship("GeoMunicipalityBoundary", back_populates="municipality", uselist=False)
    toponyms = relationship("GeoCalabriaToponym", back_populates="municipality")


class GeoProvinceBoundary(Base):
    __tablename__ = "geo_province_boundaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("geo_provinces.id"), nullable=False, unique=True, index=True)
    source_name = Column(String(150), nullable=True)
    geometry_geojson = Column(Text, nullable=True)
    centroid_latitude = Column(Float, nullable=True)
    centroid_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    province = relationship("GeoProvince", back_populates="boundary")


class GeoMunicipalityBoundary(Base):
    __tablename__ = "geo_municipality_boundaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    municipality_id = Column(Integer, ForeignKey("geo_municipalities.id"), nullable=False, unique=True, index=True)
    source_name = Column(String(150), nullable=True)
    geometry_geojson = Column(Text, nullable=True)
    centroid_latitude = Column(Float, nullable=True)
    centroid_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    municipality = relationship("GeoMunicipality", back_populates="boundary")


class GeoCalabriaToponym(Base):
    __tablename__ = "geo_calabria_toponyms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    province_id = Column(Integer, ForeignKey("geo_provinces.id"), nullable=True, index=True)
    municipality_id = Column(Integer, ForeignKey("geo_municipalities.id"), nullable=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    normalized_name = Column(String(200), nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    source_name = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    province = relationship("GeoProvince", back_populates="toponyms")
    municipality = relationship("GeoMunicipality", back_populates="toponyms")
