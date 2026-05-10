"""
Script di importazione anagrafica dipendenti
dal database legacy (Gestionale Laravel) al nuovo schema.

Eseguire con:
  cd backend
  venv\Scripts\python.exe -m execution.import_employees --dry-run
  venv\Scripts\python.exe -m execution.import_employees --source prod --dry-run
  venv\Scripts\python.exe -m execution.import_employees --source prod

PREREQUISITI:
  - Il nuovo DB locale deve avere le tabelle create (Alembic)
  - Le credenziali in .env devono essere corrette
  - PyMySQL installato
"""

import argparse
import logging
import sys
from datetime import datetime
from typing import Optional

import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Setup path per import relativi
sys.path.insert(0, __file__.rsplit("backend", 1)[0] + "backend")

from app.core.config import settings
from app.models.employee import (
    Employee, EmployeeQualification, EmployeeDocument,
    EmployeeOperationalRole, EmployeeType, EmployeeStatus,
    ContractType, Gender, RetirementStatus
)
from app.core.database import Base

# ============================================
# CONFIGURAZIONE LOGGING
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"import_employees_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
    ]
)
log = logging.getLogger(__name__)


# ============================================
# CONNESSIONE DB SORGENTE (Legacy)
# ============================================
def get_source_connection(source: str) -> pymysql.Connection:
    """Connessione al DB legacy tramite PyMySQL diretto."""
    if source == "prod":
        log.info("🔌 Connessione al DB di produzione...")
        conn = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10,
        )
    else:
        log.info("🔌 Connessione al DB di sviluppo locale (legacy)...")
        conn = pymysql.connect(
            host="localhost",
            port=3306,
            user="root",
            password="",
            database="gestionale_cv_legacy",  # Importa prima il dump qui
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
    log.info("✅ Connessione DB sorgente stabilita.")
    return conn


# ============================================
# MAPPING STATUS
# ============================================
STATO_MAP = {
    "active": EmployeeStatus.in_servizio,
    "attivo": EmployeeStatus.in_servizio,
    "in_servizio": EmployeeStatus.in_servizio,
    "malattia": EmployeeStatus.malattia,
    "infortunio": EmployeeStatus.infortunio,
    "aspettativa": EmployeeStatus.aspettativa,
    "maternita": EmployeeStatus.maternita,
    "maternità": EmployeeStatus.maternita,
    "distaccato": EmployeeStatus.distaccato,
    "sospeso": EmployeeStatus.sospeso,
    "cessato": EmployeeStatus.cessato,
    "pensionato": EmployeeStatus.pensionato,
    "pensionata": EmployeeStatus.pensionato,
}

RETIREMENT_MAP = {
    "non_verificata": RetirementStatus.non_verificata,
    "verificata": RetirementStatus.verificata,
    "pensionato": RetirementStatus.pensionato,
    "pensionata": RetirementStatus.pensionata,
}


def normalize_cf(cf: Optional[str]) -> Optional[str]:
    """Normalizza codice fiscale: maiuscolo, strip spazi."""
    if not cf:
        return None
    return cf.strip().upper()


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalizza numero di telefono."""
    if not phone:
        return None
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if cleaned and not cleaned.startswith("+"):
        if cleaned.startswith("39"):
            cleaned = "+" + cleaned
        elif cleaned.startswith("0") or cleaned.startswith("3"):
            cleaned = "+39" + cleaned
    return cleaned[:30] if cleaned else None


# ============================================
# IMPORT INTERNAL EMPLOYEES
# ============================================
def import_internal_employees(
    source_conn: pymysql.Connection,
    dest_session: Session,
    dry_run: bool = True,
) -> dict:
    """Importa i dipendenti interni (ex internal_employees)."""
    stats = {"totale": 0, "importati": 0, "aggiornati": 0, "saltati": 0, "errori": 0}

    with source_conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                ie.id AS legacy_id,
                ie.first_name,
                ie.last_name,
                ie.tax_code,
                ie.gender,
                ie.birth_date,
                ie.birth_place,
                ie.badge_number,
                ie.position,
                ie.employee_type,
                ie.status,
                ie.email,
                ie.personal_email,
                ie.pec,
                ie.phone,
                ie.personal_phone,
                ie.is_aib_qualified,
                ie.is_dos,
                ie.is_emergency_available,
                ie.is_emergency_coordinator,
                ie.is_operations_room_manager,
                ie.is_operations_room_operator,
                ie.is_mechanical_operator,
                ie.is_aib_pc_operator,
                ie.is_pc_operator,
                ie.is_driver,
                ie.organization_id,
                ie.notes,
                ie.retirement_status,
                ie.created_at,
                ie.updated_at
            FROM internal_employees ie
            ORDER BY ie.last_name, ie.first_name
        """)
        rows = cursor.fetchall()

    log.info(f"📊 Trovati {len(rows)} dipendenti interni nel DB sorgente.")
    stats["totale"] = len(rows)

    for row in rows:
        try:
            cf = normalize_cf(row.get("tax_code"))
            if not cf:
                log.warning(f"⚠ Riga legacy_id={row['legacy_id']}: CF mancante, saltato.")
                stats["saltati"] += 1
                continue

            # Cerca se esiste già per CF
            existing = dest_session.query(Employee).filter_by(codice_fiscale=cf).first()

            # Mappa stato
            raw_status = (row.get("status") or "").lower()
            stato = STATO_MAP.get(raw_status, EmployeeStatus.in_servizio)

            # Mappa quiescenza
            raw_ret = (row.get("retirement_status") or "non_verificata").lower()
            stato_quiescenza = RETIREMENT_MAP.get(raw_ret, RetirementStatus.non_verificata)

            # Mappa genere
            genere = None
            if row.get("gender"):
                g = row["gender"].upper()
                if g in ("M", "F"):
                    genere = Gender(g)

            emp_data = {
                "tipo": EmployeeType.interno,
                "codice_fiscale": cf,
                "nome": (row.get("first_name") or "").strip().title(),
                "cognome": (row.get("last_name") or "").strip().title(),
                "genere": genere,
                "data_nascita": row.get("birth_date"),
                "luogo_nascita": (row.get("birth_place") or "").strip() or None,
                "email_istituzionale": (row.get("email") or "").strip().lower() or None,
                "pec": (row.get("pec") or "").strip().lower() or None,
                "email_personale": (row.get("personal_email") or "").strip().lower() or None,
                "telefono_lavoro": normalize_phone(row.get("phone")),
                "telefono_personale": normalize_phone(row.get("personal_phone")),
                "numero_matricola": (row.get("badge_number") or "").strip() or None,
                "mansione": (row.get("position") or "").strip() or None,
                "stato": stato,
                "stato_quiescenza": stato_quiescenza,
                "organization_id": row.get("organization_id"),
                "is_aib_qualificato": bool(row.get("is_aib_qualified")),
                "is_dos": bool(row.get("is_dos")),
                "is_emergency_available": bool(row.get("is_emergency_available")),
                "is_emergency_coordinator": bool(row.get("is_emergency_coordinator")),
                "is_operations_room_manager": bool(row.get("is_operations_room_manager")),
                "is_operations_room_operator": bool(row.get("is_operations_room_operator")),
                "is_mechanical_operator": bool(row.get("is_mechanical_operator")),
                "is_aib_pc_operator": bool(row.get("is_aib_pc_operator")),
                "is_pc_operator": bool(row.get("is_pc_operator")),
                "is_driver": bool(row.get("is_driver")),
                "note": (row.get("notes") or "").strip() or None,
            }

            if existing:
                for k, v in emp_data.items():
                    setattr(existing, k, v)
                if not dry_run:
                    dest_session.flush()
                log.debug(f"🔄 Aggiornato: {emp_data['cognome']} {emp_data['nome']} ({cf})")
                stats["aggiornati"] += 1
            else:
                emp = Employee(**emp_data)
                if not dry_run:
                    dest_session.add(emp)
                    dest_session.flush()
                log.debug(f"✅ Importato: {emp_data['cognome']} {emp_data['nome']} ({cf})")
                stats["importati"] += 1

        except Exception as e:
            log.error(f"❌ Errore su legacy_id={row.get('legacy_id')}: {e}")
            stats["errori"] += 1
            if not dry_run:
                dest_session.rollback()

    return stats


# ============================================
# IMPORT EXTERNAL EMPLOYEES
# ============================================
def import_external_employees(
    source_conn: pymysql.Connection,
    dest_session: Session,
    dry_run: bool = True,
) -> dict:
    """Importa i collaboratori esterni (ex external_employees)."""
    stats = {"totale": 0, "importati": 0, "aggiornati": 0, "saltati": 0, "errori": 0}

    with source_conn.cursor() as cursor:
        cursor.execute("""
            SELECT
                ee.id AS legacy_id,
                ee.first_name,
                ee.last_name,
                ee.tax_code,
                ee.birth_date,
                ee.birth_place_text,
                ee.job_title,
                ee.start_date,
                ee.end_date,
                ee.organization_id,
                ee.gender,
                ee.is_aib,
                ee.is_dos,
                ee.is_emergency_available,
                ee.is_emergency_coordinator,
                ee.is_operations_room_manager,
                ee.is_operations_room_operator,
                ee.is_mechanical_operator,
                ee.is_aib_pc_operator,
                ee.is_pc_operator,
                ee.is_driver,
                ee.notes,
                ee.created_at
            FROM external_employees ee
            ORDER BY ee.last_name, ee.first_name
        """)
        rows = cursor.fetchall()

    log.info(f"📊 Trovati {len(rows)} collaboratori esterni nel DB sorgente.")
    stats["totale"] = len(rows)

    for row in rows:
        try:
            cf = normalize_cf(row.get("tax_code"))
            if not cf:
                log.warning(f"⚠ Collaboratore esterno legacy_id={row['legacy_id']}: CF mancante, saltato.")
                stats["saltati"] += 1
                continue

            existing = dest_session.query(Employee).filter_by(codice_fiscale=cf).first()

            # Determina stato da date contratto
            end_date = row.get("end_date")
            if end_date and end_date < datetime.now().date():
                stato = EmployeeStatus.cessato
            else:
                stato = EmployeeStatus.in_servizio

            # Genere
            genere = None
            if row.get("gender"):
                g = row["gender"].upper()
                if g in ("M", "F"):
                    genere = Gender(g)

            # Tipo contratto: esterni sono stagionali/collaborazioni
            tipo_contratto = ContractType.stagionale
            if end_date is None:
                tipo_contratto = ContractType.collaborazione

            emp_data = {
                "tipo": EmployeeType.esterno,
                "codice_fiscale": cf,
                "nome": (row.get("first_name") or "").strip().title(),
                "cognome": (row.get("last_name") or "").strip().title(),
                "genere": genere,
                "data_nascita": row.get("birth_date"),
                "luogo_nascita": (row.get("birth_place_text") or "").strip() or None,
                "mansione": (row.get("job_title") or "").strip() or None,
                "tipo_contratto": tipo_contratto,
                "data_assunzione": row.get("start_date"),
                "data_fine_contratto": end_date,
                "stato": stato,
                "organization_id": row.get("organization_id"),
                "is_aib_qualificato": bool(row.get("is_aib")),
                "is_dos": bool(row.get("is_dos")),
                "is_emergency_available": bool(row.get("is_emergency_available")),
                "is_emergency_coordinator": bool(row.get("is_emergency_coordinator")),
                "is_operations_room_manager": bool(row.get("is_operations_room_manager")),
                "is_operations_room_operator": bool(row.get("is_operations_room_operator")),
                "is_mechanical_operator": bool(row.get("is_mechanical_operator")),
                "is_aib_pc_operator": bool(row.get("is_aib_pc_operator")),
                "is_pc_operator": bool(row.get("is_pc_operator")),
                "is_driver": bool(row.get("is_driver")),
                "note": (row.get("notes") or "").strip() or None,
            }

            if existing:
                log.debug(f"⚠ CF già presente (interno?): {cf} — skip esterno.")
                stats["saltati"] += 1
            else:
                emp = Employee(**emp_data)
                if not dry_run:
                    dest_session.add(emp)
                    dest_session.flush()
                log.debug(f"✅ Importato esterno: {emp_data['cognome']} {emp_data['nome']} ({cf})")
                stats["importati"] += 1

        except Exception as e:
            log.error(f"❌ Errore esterno legacy_id={row.get('legacy_id')}: {e}")
            stats["errori"] += 1

    return stats


# ============================================
# MAIN
# ============================================
def main():
    parser = argparse.ArgumentParser(
        description="Importa l'anagrafica dipendenti dal DB legacy al nuovo gestionale"
    )
    parser.add_argument(
        "--source",
        choices=["prod", "local"],
        default="local",
        help="Sorgente dati: 'prod' = DB produzione, 'local' = dump locale (default: local)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula l'importazione senza scrivere nel DB di destinazione"
    )
    parser.add_argument(
        "--only",
        choices=["internal", "external", "all"],
        default="all",
        help="Importa solo dipendenti interni, solo esterni, o tutti (default: all)"
    )
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("IMPORT ANAGRAFICA — Gestionale Calabria Verde")
    log.info(f"Sorgente: {args.source.upper()} | Dry-run: {args.dry_run}")
    log.info("=" * 60)

    if args.dry_run:
        log.warning("⚠ MODALITÀ DRY-RUN: nessun dato verrà scritto nel DB di destinazione.")

    # Connessione DB sorgente
    try:
        source_conn = get_source_connection(args.source)
    except Exception as e:
        log.error(f"❌ Impossibile connettersi al DB sorgente: {e}")
        sys.exit(1)

    # Connessione DB destinazione
    dest_engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
    )

    stats_internal = {"totale": 0, "importati": 0, "aggiornati": 0, "saltati": 0, "errori": 0}
    stats_external = {"totale": 0, "importati": 0, "aggiornati": 0, "saltati": 0, "errori": 0}

    with Session(dest_engine) as session:
        try:
            if args.only in ("internal", "all"):
                log.info("\n📋 Importazione dipendenti INTERNI...")
                stats_internal = import_internal_employees(source_conn, session, dry_run=args.dry_run)

            if args.only in ("external", "all"):
                log.info("\n📋 Importazione collaboratori ESTERNI...")
                stats_external = import_external_employees(source_conn, session, dry_run=args.dry_run)

            if not args.dry_run:
                session.commit()
                log.info("\n✅ COMMIT eseguito con successo.")
            else:
                session.rollback()
                log.info("\n↩ Dry-run: nessun commit eseguito.")

        except Exception as e:
            session.rollback()
            log.error(f"❌ Errore critico durante l'importazione: {e}")
            raise

    source_conn.close()

    # ============================================
    # REPORT FINALE
    # ============================================
    log.info("\n" + "=" * 60)
    log.info("REPORT FINALE IMPORTAZIONE")
    log.info("=" * 60)

    total_processed = stats_internal["totale"] + stats_external["totale"]
    total_imported = stats_internal["importati"] + stats_external["importati"]
    total_updated = stats_internal["aggiornati"] + stats_external["aggiornati"]
    total_skipped = stats_internal["saltati"] + stats_external["saltati"]
    total_errors = stats_internal["errori"] + stats_external["errori"]

    log.info(f"Dipendenti interni:    {stats_internal['totale']:5d} trovati | {stats_internal['importati']:5d} importati | {stats_internal['aggiornati']:5d} aggiornati | {stats_internal['saltati']:5d} saltati | {stats_internal['errori']:3d} errori")
    log.info(f"Collaboratori esterni: {stats_external['totale']:5d} trovati | {stats_external['importati']:5d} importati | {stats_external['aggiornati']:5d} aggiornati | {stats_external['saltati']:5d} saltati | {stats_external['errori']:3d} errori")
    log.info("-" * 60)
    log.info(f"TOTALE:               {total_processed:5d} trovati | {total_imported:5d} importati | {total_updated:5d} aggiornati | {total_skipped:5d} saltati | {total_errors:3d} errori")

    if total_errors > 0:
        log.warning(f"\n⚠ {total_errors} record con errori — controllare il log per i dettagli.")
        sys.exit(1)
    else:
        log.info("\n🎉 Importazione completata con successo!")


if __name__ == "__main__":
    main()
