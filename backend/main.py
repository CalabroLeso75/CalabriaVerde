"""
Calabria Verde - Gestionale Aziendale
Backend API (FastAPI)
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.auth.router import router as auth_router
from app.api.users.router import router as users_router
from app.api.hr.router import router as hr_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup e shutdown dell'applicazione."""
    # Startup
    print(f"🟢 Gestionale Calabria Verde v{settings.APP_VERSION} avviato")
    print(f"📊 Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    yield
    # Shutdown
    print("🔴 Gestionale Calabria Verde arrestato")


app = FastAPI(
    title=settings.APP_NAME,
    description="API backend per il Gestionale Aziendale di Calabria Verde",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrazione router API
app.include_router(auth_router, prefix="/api/auth", tags=["Autenticazione"])
app.include_router(users_router, prefix="/api/users", tags=["Utenti"])
app.include_router(hr_router, prefix="/api/hr", tags=["Risorse Umane"])


@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Verifica stato del sistema."""
    return {
        "status": "online",
        "version": settings.APP_VERSION,
        "app": settings.APP_NAME,
    }
