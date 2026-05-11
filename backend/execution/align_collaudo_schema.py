"""
Allinea il database locale di collaudo allo schema atteso dai modelli Python.

Default: dry-run. Con --apply aggiunge colonne mancanti e copia i valori legacy,
senza cancellare colonne storiche.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pymysql


ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / ".tmp" / "project_completion" / "collaudo" / "schema_alignment"


def connect() -> pymysql.Connection:
    return pymysql.connect(
        host=os.getenv("IMPORT_DST_HOST", os.getenv("DB_HOST", "localhost")),
        port=int(os.getenv("IMPORT_DST_PORT", os.getenv("DB_PORT", "3306"))),
        user=os.getenv("IMPORT_DST_USER", os.getenv("DB_USER", "root")),
        password=os.getenv("IMPORT_DST_PASSWORD", os.getenv("DB_PASSWORD", "")),
        database=os.getenv("IMPORT_DST_DB", os.getenv("DB_NAME", "gestionale_cv")),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def json_default(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def columns(conn: pymysql.Connection, table: str) -> set[str]:
    with conn.cursor() as cur:
        cur.execute(f"DESCRIBE {table}")
        return {row["Field"] for row in cur.fetchall()}


def fetch_all(conn: pymysql.Connection, table: str) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT * FROM {table}")
        return cur.fetchall()


def backup_small_tables(conn: pymysql.Connection) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "tables": {
            table: fetch_all(conn, table)
            for table in ("organizations", "users", "roles", "user_roles")
        },
    }
    (REPORT_DIR / "pre_alignment_backup.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, default=json_default),
        encoding="utf-8",
    )


def add(action_log: list[str], conn: pymysql.Connection, apply: bool, sql: str) -> None:
    action_log.append(sql)
    if apply:
        with conn.cursor() as cur:
            cur.execute(sql)


def add_column_if_missing(
    action_log: list[str],
    conn: pymysql.Connection,
    apply: bool,
    table: str,
    existing: set[str],
    name: str,
    definition: str,
) -> None:
    if name not in existing:
        add(action_log, conn, apply, f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
        existing.add(name)


def align_users(action_log: list[str], conn: pymysql.Connection, apply: bool) -> None:
    cols = columns(conn, "users")
    add_column_if_missing(action_log, conn, apply, "users", cols, "password_hash", "VARCHAR(255) NULL")
    add_column_if_missing(action_log, conn, apply, "users", cols, "approved_by", "INT NULL")
    add_column_if_missing(action_log, conn, apply, "users", cols, "approved_at", "DATETIME NULL")
    add_column_if_missing(action_log, conn, apply, "users", cols, "rejection_reason", "TEXT NULL")
    add_column_if_missing(action_log, conn, apply, "users", cols, "last_login", "DATETIME NULL")
    add_column_if_missing(action_log, conn, apply, "users", cols, "is_superadmin", "TINYINT(1) NOT NULL DEFAULT 0")

    add(action_log, conn, apply, "UPDATE users SET password_hash=hashed_password WHERE password_hash IS NULL AND hashed_password IS NOT NULL")
    add(action_log, conn, apply, "UPDATE users SET approved_by=approvato_da_user_id WHERE approved_by IS NULL AND approvato_da_user_id IS NOT NULL")
    add(action_log, conn, apply, "UPDATE users SET approved_at=approvato_il WHERE approved_at IS NULL AND approvato_il IS NOT NULL")
    add(action_log, conn, apply, "UPDATE users SET last_login=last_login_at WHERE last_login IS NULL AND last_login_at IS NOT NULL")
    add(action_log, conn, apply, "UPDATE users SET is_superadmin=1 WHERE email='admin@calabriaverde.eu'")
    add(action_log, conn, apply, "ALTER TABLE users MODIFY status ENUM('pending','active','attivo','rejected','sospeso','suspended','disattivato') NOT NULL DEFAULT 'pending'")
    add(action_log, conn, apply, "UPDATE users SET status='attivo' WHERE status='active'")
    add(action_log, conn, apply, "UPDATE users SET status='sospeso' WHERE status='suspended'")
    add(action_log, conn, apply, "UPDATE users SET status='disattivato' WHERE status='rejected'")
    add(action_log, conn, apply, "ALTER TABLE users MODIFY status ENUM('pending','attivo','sospeso','disattivato') NOT NULL DEFAULT 'pending'")


def align_roles(action_log: list[str], conn: pymysql.Connection, apply: bool) -> None:
    cols = columns(conn, "roles")
    add_column_if_missing(action_log, conn, apply, "roles", cols, "code", "VARCHAR(50) NULL")
    add_column_if_missing(action_log, conn, apply, "roles", cols, "name", "VARCHAR(100) NULL")
    add_column_if_missing(action_log, conn, apply, "roles", cols, "description", "TEXT NULL")
    add_column_if_missing(action_log, conn, apply, "roles", cols, "level", "INT NOT NULL DEFAULT 0")
    add(action_log, conn, apply, "UPDATE roles SET code=codice WHERE code IS NULL AND codice IS NOT NULL")
    add(action_log, conn, apply, "UPDATE roles SET name=nome WHERE name IS NULL AND nome IS NOT NULL")
    add(action_log, conn, apply, "UPDATE roles SET description=descrizione WHERE description IS NULL AND descrizione IS NOT NULL")
    add(
        action_log,
        conn,
        apply,
        """
        UPDATE roles SET level = CASE code
            WHEN 'superadmin' THEN 100
            WHEN 'admin' THEN 90
            WHEN 'responsabile_distretto' THEN 70
            WHEN 'dos' THEN 60
            WHEN 'direttore_lavori' THEN 60
            WHEN 'capo_squadra' THEN 50
            WHEN 'addetto_hr' THEN 50
            WHEN 'operatore_magazzino' THEN 30
            WHEN 'addetto_flotta' THEN 30
            WHEN 'operatore_sala' THEN 30
            ELSE 20
        END
        """.strip(),
    )


def align_user_roles(action_log: list[str], conn: pymysql.Connection, apply: bool) -> None:
    cols = columns(conn, "user_roles")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "module_scope", "VARCHAR(50) NULL")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "valid_from", "DATETIME NULL")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "valid_to", "DATETIME NULL")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "is_active", "TINYINT(1) NOT NULL DEFAULT 1")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "created_at", "DATETIME NULL")
    add_column_if_missing(action_log, conn, apply, "user_roles", cols, "assigned_by", "INT NULL")
    add(action_log, conn, apply, "UPDATE user_roles SET valid_from=assigned_at WHERE valid_from IS NULL AND assigned_at IS NOT NULL")
    add(action_log, conn, apply, "UPDATE user_roles SET created_at=assigned_at WHERE created_at IS NULL AND assigned_at IS NOT NULL")
    add(action_log, conn, apply, "UPDATE user_roles SET assigned_by=assigned_by_user_id WHERE assigned_by IS NULL AND assigned_by_user_id IS NOT NULL")


def align_organizations(action_log: list[str], conn: pymysql.Connection, apply: bool) -> None:
    cols = columns(conn, "organizations")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "code", "VARCHAR(20) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "name", "VARCHAR(200) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "type", "VARCHAR(50) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "address", "VARCHAR(300) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "city", "VARCHAR(100) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "province", "VARCHAR(2) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "cap", "VARCHAR(5) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "latitude", "FLOAT NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "longitude", "FLOAT NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "phone", "VARCHAR(20) NULL")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "is_active", "TINYINT(1) NOT NULL DEFAULT 1")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "is_temporary", "TINYINT(1) NOT NULL DEFAULT 0")
    add_column_if_missing(action_log, conn, apply, "organizations", cols, "notes", "TEXT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET code=codice WHERE code IS NULL AND codice IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET name=nome WHERE name IS NULL AND nome IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET type='sede_centrale' WHERE type IS NULL")
    add(action_log, conn, apply, "UPDATE organizations SET address=indirizzo WHERE address IS NULL AND indirizzo IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET city=comune WHERE city IS NULL AND comune IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET province=LEFT(provincia,2) WHERE province IS NULL AND provincia IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET latitude=latitudine WHERE latitude IS NULL AND latitudine IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET longitude=longitudine WHERE longitude IS NULL AND longitudine IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET phone=telefono WHERE phone IS NULL AND telefono IS NOT NULL")
    add(action_log, conn, apply, "UPDATE organizations SET is_active=is_attiva WHERE is_attiva IS NOT NULL")


def collect_counts(conn: pymysql.Connection) -> dict[str, Any]:
    counts: dict[str, Any] = {}
    with conn.cursor() as cur:
        for table in ("organizations", "users", "roles", "user_roles", "employees"):
            cur.execute(f"SELECT COUNT(*) AS count FROM {table}")
            counts[table] = cur.fetchone()["count"]
        cur.execute("SELECT status, COUNT(*) AS count FROM users GROUP BY status")
        counts["users_by_status"] = cur.fetchall()
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description="Allinea schema locale di collaudo.")
    parser.add_argument("--apply", action="store_true", help="Applica davvero le alterazioni.")
    args = parser.parse_args()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    action_log: list[str] = []
    with connect() as conn:
        try:
            before = collect_counts(conn)
            if args.apply:
                backup_small_tables(conn)
            align_organizations(action_log, conn, args.apply)
            align_users(action_log, conn, args.apply)
            align_roles(action_log, conn, args.apply)
            align_user_roles(action_log, conn, args.apply)
            if args.apply:
                conn.commit()
            else:
                conn.rollback()
            after = collect_counts(conn)
        except Exception:
            conn.rollback()
            raise

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "actions": action_log,
        "before": before,
        "after": after,
    }
    (REPORT_DIR / "summary.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, default=json_default), encoding="utf-8")
    print(f"Mode: {report['mode']}")
    print(f"Azioni previste/eseguite: {len(action_log)}")
    print(f"Report: {REPORT_DIR / 'summary.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
