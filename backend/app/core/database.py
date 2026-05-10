"""
Configurazione del database MySQL con SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base per tutti i modelli SQLAlchemy."""
    pass


def get_db():
    """Dependency injection per ottenere una sessione DB."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
