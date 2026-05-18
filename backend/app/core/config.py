"""
Configurazione centralizzata dell'applicazione.
Carica le variabili dal file .env nella root del progetto.
"""
import os
from pathlib import Path
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Impostazioni globali del gestionale."""

    # Applicazione
    APP_NAME: str = "Gestionale Calabria Verde"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "calabriaverde-dev-secret-key-change-in-production"

    # Database MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "gestionale_cv"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    LOCAL_DB_NO_PASSWORD: bool = False

    # Database di produzione (vecchio hosting)
    PROD_DB_HOST: str = ""
    PROD_DB_PORT: int = 3306
    PROD_DB_NAME: str = ""
    PROD_DB_USER: str = ""
    PROD_DB_PASSWORD: str = ""

    # JWT
    JWT_SECRET_KEY: str = "calabriaverde-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 ore
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://gestionale.calabriaverde.eu",
        "https://smart-cv.it",
    ]

    # VPS
    VPS_HOST: str = ""
    VPS_USER: str = "root"
    VPS_SSH_KEY_PATH: str = "storage/vps_keys/id_rsa_vps"

    # Email (Aruba SMTP)
    SMTP_HOST: str = "smtps.aruba.it"
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""

    # Parco macchine - provider dati esterni
    FLEET_EXTERNAL_LOOKUP_ENABLED: bool = False
    FLEET_PLATE_PROVIDER: str = "none"
    FLEET_PLATE_API_URL: str = "https://www.targa.co.it/api/reg.asmx"
    FLEET_PLATE_USERNAME: str = ""
    FLEET_PLATE_API_KEY: str = ""
    FLEET_PLATE_JOB_TYPES: str = "tecnici"
    FLEET_PLATE_TIMEOUT_SECONDS: int = 55
    FLEET_VIN_PROVIDER: str = "nhtsa"
    WHEEL_SIZE_API_URL: str = "https://api.wheel-size.com/v2"
    WHEEL_SIZE_API_KEY: str = ""

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_mode(cls, value):
        """Accetta valori storici dell'env come release/debug."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"debug", "dev", "development"}:
                return True
        return value

    @property
    def DATABASE_URL(self) -> str:
        """URL di connessione al database locale."""
        password = "" if self.LOCAL_DB_NO_PASSWORD else self.DB_PASSWORD
        return f"mysql+pymysql://{self.DB_USER}:{password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def PROD_DATABASE_URL(self) -> str:
        """URL di connessione al database di produzione."""
        return f"mysql+pymysql://{self.PROD_DB_USER}:{self.PROD_DB_PASSWORD}@{self.PROD_DB_HOST}:{self.PROD_DB_PORT}/{self.PROD_DB_NAME}?charset=utf8mb4"

    class Config:
        env_file = ROOT_DIR / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
