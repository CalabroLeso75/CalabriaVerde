"""
Configurazione centralizzata dell'applicazione.
Carica le variabili dal file .env nella root del progetto.
"""
import os
from typing import List
from pydantic_settings import BaseSettings


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

    @property
    def DATABASE_URL(self) -> str:
        """URL di connessione al database locale."""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def PROD_DATABASE_URL(self) -> str:
        """URL di connessione al database di produzione."""
        return f"mysql+pymysql://{self.PROD_DB_USER}:{self.PROD_DB_PASSWORD}@{self.PROD_DB_HOST}:{self.PROD_DB_PORT}/{self.PROD_DB_NAME}?charset=utf8mb4"

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
