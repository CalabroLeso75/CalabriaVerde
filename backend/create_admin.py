"""Crea o aggiorna il superadmin locale.

La password va fornita tramite variabile d'ambiente CV_ADMIN_PASSWORD.
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.user import Role, User, UserRole  # noqa: E402


ADMIN_EMAIL = "admin@calabriaverde.eu"
ADMIN_CF = "ADMNCV00A01F217X"


def main() -> int:
    password = os.getenv("CV_ADMIN_PASSWORD")
    if not password:
        print("Imposta CV_ADMIN_PASSWORD prima di eseguire lo script.")
        return 1

    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.code == "superadmin").first()
        if not role:
            role = Role(
                code="superadmin",
                name="Super Amministratore",
                description="Accesso completo a tutto il sistema",
                level=100,
            )
            db.add(role)
            db.flush()

        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not user:
            user = User(
                email=ADMIN_EMAIL,
                codice_fiscale=ADMIN_CF,
                nome="Admin",
                cognome="Sistema",
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)

        user.password_hash = get_password_hash(password)
        user.status = "attivo"
        user.is_superadmin = True
        user.updated_at = datetime.now(timezone.utc)
        db.flush()

        existing_role = db.query(UserRole).filter(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
            UserRole.is_active == True,  # noqa: E712
        ).first()
        if not existing_role:
            db.add(UserRole(user_id=user.id, role_id=role.id, is_active=True))

        db.commit()
        print(f"Superadmin pronto: {ADMIN_EMAIL}")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Errore creazione superadmin: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
