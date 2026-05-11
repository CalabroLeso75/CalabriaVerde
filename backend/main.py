"""
Calabria Verde - Gestionale Aziendale
Backend API (FastAPI)
"""
import sys
import os
import asyncio
from contextlib import asynccontextmanager

# Fix encoding Windows
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models import organization, user, employee  # noqa: F401
from app.api.auth.router import router as auth_router
from app.api.users.router import router as users_router
from app.api.hr.router import router as hr_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup e shutdown dell'applicazione."""
    # Startup
    print(f"[OK] Gestionale Calabria Verde v{settings.APP_VERSION} avviato")
    print(f"[DB] {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    yield
    # Shutdown
    print("[STOP] Gestionale Calabria Verde arrestato")


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
