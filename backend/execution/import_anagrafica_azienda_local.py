"""
Importazione idempotente anagrafica da azienda_local a gestionale_cv.

Default: dry-run con report in .tmp/project_completion/collaudo/import_anagrafica/.
Scrive sul database solo se avviato con --apply.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pymysql


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORT_DIR = ROOT / ".tmp" / "project_completion" / "collaudo" / "import_anagrafica"


STATO_MAP = {
    "operativo": "in_servizio",
    "cessato": "cessato",
    "sospeso": "sospeso",
    "in_attesa": "in_servizio",
}

CONTRATTO_MAP_KEYS = (
    ("INDET", "indeterminato"),
    ("T-IN", "indeterminato"),
    ("STAG", "stagionale"),
    ("DET", "determinato"),
    ("SOMM", "somministrazione"),
    ("COLLAB", "collaborazione"),
    ("VOLONT", "volontario"),
)


@dataclass(frozen=True)
class DbConfig:
    host: str
    port: int
    user: str
    password: str
    database: str


def env_config(prefix: str, default_database: str) -> DbConfig:
    return DbConfig(
        host=os.getenv(f"{prefix}_HOST", "localhost"),
        port=int(os.getenv(f"{prefix}_PORT", "3306")),
        user=os.getenv(f"{prefix}_USER", "root"),
        password=os.getenv(f"{prefix}_PASSWORD", ""),
        database=os.getenv(f"{prefix}_DB", default_database),
    )


def connect(config: DbConfig) -> pymysql.Connection:
    return pymysql.connect(
        host=config.host,
        port=config.port,
        user=config.user,
        password=config.password,
        database=config.database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
        autocommit=False,
    )


def setup_logger(report_dir: Path) -> logging.Logger:
    report_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("import_anagrafica")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    stream = logging.StreamHandler(sys.stdout)
    stream.setFormatter(formatter)
    file_handler = logging.FileHandler(report_dir / "last_run.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(stream)
    logger.addHandler(file_handler)
    return logger


def describe_columns(conn: pymysql.Connection, table: str) -> set[str]:
    with conn.cursor() as cur:
        cur.execute(f"DESCRIBE {table}")
        return {row["Field"] for row in cur.fetchall()}


def pick_column(columns: set[str], candidates: tuple[str, ...]) -> str:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    raise RuntimeError(f"Nessuna colonna disponibile tra: {', '.join(candidates)}")


def clean(value: Any, limit: int | None = None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit] if limit else text


def title(value: Any, limit: int) -> str:
    text = clean(value, limit) or ""
    return text.title()


def normalize_cf(value: Any) -> str | None:
    text = clean(value, 16)
    return text.upper() if text else None


def normalize_email(value: Any) -> str | None:
    text = clean(value, 150)
    return text.lower() if text else None


def normalize_gender(value: Any) -> str | None:
    text = (clean(value) or "").lower()
    if text == "uomo":
        return "M"
    if text == "donna":
        return "F"
    if text in {"m", "f", "nb"}:
        return text.upper()
    return None


def get_contract_map(src: pymysql.Connection) -> dict[int, str]:
    with src.cursor() as cur:
        cur.execute("SELECT id, codice FROM anag_contratti")
        rows = cur.fetchall()
    return {int(row["id"]): (row["codice"] or "").upper() for row in rows}


def map_contract(contracts: dict[int, str], contract_id: Any) -> str:
    if not contract_id:
        return "indeterminato"
    code = contracts.get(int(contract_id), "")
    for key, value in CONTRATTO_MAP_KEYS:
        if key in code:
            return value
    return "indeterminato"


def ensure_main_organization(src: pymysql.Connection, dst: pymysql.Connection, apply: bool) -> int | None:
    src_columns = describe_columns(src, "anag_organizzazioni")
    dst_columns = describe_columns(dst, "organizations")
    with src.cursor() as cur:
        cur.execute("SELECT * FROM anag_organizzazioni ORDER BY id LIMIT 1")
        source_org = cur.fetchone()
    if not source_org:
        return None

    code = clean(source_org.get("codice_esterno"), 20) or "ACV"
    name = clean(source_org.get("nome"), 200) or "Azienda Calabria Verde"
    del src_columns  # documenta che lo schema sorgente e' stato verificato.

    with dst.cursor() as cur:
        if "code" in dst_columns:
            cur.execute("SELECT id FROM organizations WHERE code=%s LIMIT 1", (code,))
            existing = cur.fetchone()
            if existing:
                return int(existing["id"])
            if apply:
                cur.execute(
                    """
                    INSERT INTO organizations
                    (code, name, type, is_active, is_temporary, created_at, updated_at)
                    VALUES (%s, %s, 'sede_centrale', 1, 0, NOW(), NOW())
                    """,
                    (code, name),
                )
                return int(cur.lastrowid)
            return None

        cur.execute("SELECT id FROM organizations WHERE codice=%s LIMIT 1", (code,))
        existing = cur.fetchone()
        if existing:
            return int(existing["id"])
        if apply:
            cur.execute(
                """
                INSERT INTO organizations
                (codice, nome, tipo, is_aib, is_attiva, created_at, updated_at)
                VALUES (%s, %s, 'ente', 1, 1, NOW(), NOW())
                """,
                (code, name),
            )
            return int(cur.lastrowid)
    return None


def fetch_source_people(src: pymysql.Connection) -> list[dict[str, Any]]:
    mun_cols = describe_columns(src, "it_municipalities")
    prov_cols = describe_columns(src, "it_provinces")
    mun_name_col = pick_column(mun_cols, ("name", "nome", "denominazione"))
    prov_sigla_col = pick_column(prov_cols, ("short_code", "sigla", "abbreviation", "code"))

    query = f"""
        SELECT
            ap.id, ap.nome, ap.cognome, ap.codice_fiscale, ap.data_nascita,
            ap.luogo_nascita_testo, ap.genere, ap.matricola,
            ap.tipo_personale, ap.stato_rapporto,
            ap.email_aziendale, ap.email_personale,
            ap.telefono_aziendale, ap.telefono_personale,
            ap.note, ap.contratto_id, ap.ccnl_posizione,
            mun.{mun_name_col} AS luogo_nascita_nome,
            prov.{prov_sigla_col} AS provincia_sigla
        FROM anag_persone ap
        LEFT JOIN it_municipalities mun ON mun.id = ap.luogo_nascita_id
        LEFT JOIN it_provinces prov ON prov.id = ap.luogo_nascita_provincia_id
        ORDER BY ap.cognome, ap.nome, ap.id
    """
    with src.cursor() as cur:
        cur.execute(query)
        return cur.fetchall()


def build_employee(row: dict[str, Any], contracts: dict[int, str], organization_id: int | None) -> dict[str, Any]:
    tipo = "interno" if row.get("tipo_personale") == "interno" else "esterno"
    stato = STATO_MAP.get((clean(row.get("stato_rapporto")) or "operativo").lower(), "in_servizio")
    luogo = clean(row.get("luogo_nascita_nome") or row.get("luogo_nascita_testo"), 100)
    return {
        "tipo": tipo,
        "codice_fiscale": normalize_cf(row.get("codice_fiscale")),
        "nome": title(row.get("nome"), 100),
        "cognome": title(row.get("cognome"), 100),
        "genere": normalize_gender(row.get("genere")),
        "data_nascita": row.get("data_nascita"),
        "luogo_nascita": luogo,
        "provincia_nascita": clean(row.get("provincia_sigla"), 5),
        "email_istituzionale": normalize_email(row.get("email_aziendale")),
        "email_personale": normalize_email(row.get("email_personale")),
        "telefono_lavoro": clean(row.get("telefono_aziendale"), 30),
        "telefono_personale": clean(row.get("telefono_personale"), 30),
        "tipo_contratto": map_contract(contracts, row.get("contratto_id")),
        "numero_matricola": clean(row.get("matricola"), 20),
        "mansione": clean(row.get("ccnl_posizione"), 200),
        "stato": stato,
        "stato_quiescenza": "non_verificata",
        "organization_id": organization_id,
        "note": clean(row.get("note"), 1000),
    }


def comparable(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if value == "":
        return None
    return value


def changed_fields(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    changes: dict[str, Any] = {}
    for key, value in incoming.items():
        if comparable(existing.get(key)) != comparable(value):
            changes[key] = {"from": comparable(existing.get(key)), "to": comparable(value)}
    return changes


def write_anomalies(report_dir: Path, anomalies: list[dict[str, Any]]) -> None:
    path = report_dir / "anomalie.csv"
    fieldnames = ["tipo", "source_id", "codice_fiscale", "matricola", "messaggio"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(anomalies)


def write_changes(report_dir: Path, changes: list[dict[str, Any]]) -> None:
    path = report_dir / "differenze.csv"
    fieldnames = ["source_id", "codice_fiscale", "matricola", "campo", "valore_attuale", "valore_import"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(changes)


def run_import(src: pymysql.Connection, dst: pymysql.Connection, apply: bool, report_dir: Path, logger: logging.Logger) -> dict[str, Any]:
    contracts = get_contract_map(src)
    people = fetch_source_people(src)
    organization_id = ensure_main_organization(src, dst, apply)

    summary = {
        "mode": "apply" if apply else "dry-run",
        "source_rows": len(people),
        "inserted": 0,
        "updated": 0,
        "unchanged": 0,
        "skipped": 0,
        "errors": 0,
        "would_insert": 0,
        "would_update": 0,
        "would_unchanged": 0,
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "finished_at": None,
    }
    anomalies: list[dict[str, Any]] = []
    diff_rows: list[dict[str, Any]] = []
    seen_cf: set[str] = set()
    seen_matricole: set[str] = set()

    columns = [
        "tipo", "codice_fiscale", "nome", "cognome", "genere", "data_nascita",
        "luogo_nascita", "provincia_nascita", "email_istituzionale", "email_personale",
        "telefono_lavoro", "telefono_personale", "tipo_contratto", "numero_matricola",
        "mansione", "stato", "stato_quiescenza", "organization_id", "note",
    ]

    with dst.cursor() as cur:
        for row in people:
            try:
                incoming = build_employee(row, contracts, organization_id)
                cf = incoming["codice_fiscale"]
                matricola = incoming["numero_matricola"]
                if not cf:
                    summary["skipped"] += 1
                    anomalies.append({
                        "tipo": "skip",
                        "source_id": row.get("id"),
                        "codice_fiscale": "",
                        "matricola": matricola or "",
                        "messaggio": "Codice fiscale mancante",
                    })
                    continue
                if cf in seen_cf:
                    summary["skipped"] += 1
                    anomalies.append({
                        "tipo": "skip",
                        "source_id": row.get("id"),
                        "codice_fiscale": cf,
                        "matricola": matricola or "",
                        "messaggio": "Codice fiscale duplicato nella sorgente",
                    })
                    continue
                seen_cf.add(cf)
                if matricola:
                    if matricola in seen_matricole:
                        anomalies.append({
                            "tipo": "warning",
                            "source_id": row.get("id"),
                            "codice_fiscale": cf,
                            "matricola": matricola,
                            "messaggio": "Matricola duplicata nella sorgente",
                        })
                    seen_matricole.add(matricola)

                cur.execute("SELECT * FROM employees WHERE codice_fiscale=%s LIMIT 1", (cf,))
                existing = cur.fetchone()

                if existing:
                    changes = changed_fields(existing, incoming)
                    if not changes:
                        summary["unchanged" if apply else "would_unchanged"] += 1
                        continue
                    for field, change in changes.items():
                        diff_rows.append({
                            "source_id": row.get("id"),
                            "codice_fiscale": cf,
                            "matricola": incoming.get("numero_matricola") or "",
                            "campo": field,
                            "valore_attuale": change["from"],
                            "valore_import": change["to"],
                        })
                    if apply:
                        assignments = ", ".join(f"{col}=%s" for col in columns if col != "codice_fiscale")
                        values = [incoming[col] for col in columns if col != "codice_fiscale"]
                        values.append(cf)
                        cur.execute(f"UPDATE employees SET {assignments}, updated_at=NOW() WHERE codice_fiscale=%s", values)
                        summary["updated"] += 1
                    else:
                        summary["would_update"] += 1
                else:
                    if apply:
                        placeholders = ", ".join(["%s"] * len(columns))
                        cur.execute(
                            f"""
                            INSERT INTO employees ({', '.join(columns)}, created_at, updated_at)
                            VALUES ({placeholders}, NOW(), NOW())
                            """,
                            [incoming[col] for col in columns],
                        )
                        summary["inserted"] += 1
                    else:
                        summary["would_insert"] += 1

            except Exception as exc:
                summary["errors"] += 1
                anomalies.append({
                    "tipo": "error",
                    "source_id": row.get("id"),
                    "codice_fiscale": row.get("codice_fiscale") or "",
                    "matricola": row.get("matricola") or "",
                    "messaggio": str(exc),
                })
                logger.error("Errore su sorgente id=%s: %s", row.get("id"), exc)

    if apply and summary["errors"] == 0:
        dst.commit()
    else:
        dst.rollback()

    with dst.cursor() as cur:
        cur.execute("SELECT COUNT(*) AS count FROM employees")
        summary["destination_rows"] = cur.fetchone()["count"]
        cur.execute("SELECT tipo, COUNT(*) AS count FROM employees GROUP BY tipo")
        summary["destination_by_type"] = cur.fetchall()
        cur.execute("SELECT stato, COUNT(*) AS count FROM employees GROUP BY stato ORDER BY count DESC")
        summary["destination_by_status"] = cur.fetchall()

    summary["finished_at"] = datetime.now().isoformat(timespec="seconds")
    write_anomalies(report_dir, anomalies)
    write_changes(report_dir, diff_rows)
    (report_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    logger.info("Report scritto in %s", report_dir)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa anagrafica azienda_local in gestionale_cv.")
    parser.add_argument("--apply", action="store_true", help="Scrive davvero sul database destinazione.")
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR), help="Cartella report/log.")
    args = parser.parse_args()

    report_dir = Path(args.report_dir)
    logger = setup_logger(report_dir)
    logger.info("Avvio import anagrafica - mode=%s", "apply" if args.apply else "dry-run")

    src_config = env_config("IMPORT_SRC", "azienda_local")
    dst_config = env_config("IMPORT_DST", "gestionale_cv")

    try:
        with connect(src_config) as src, connect(dst_config) as dst:
            summary = run_import(src, dst, args.apply, report_dir, logger)
    except Exception as exc:
        logger.exception("Import fallito: %s", exc)
        return 1

    logger.info(
        "Fine import: source=%s dest=%s insert=%s update=%s unchanged=%s errors=%s",
        summary["source_rows"],
        summary.get("destination_rows"),
        summary["inserted"] or summary["would_insert"],
        summary["updated"] or summary["would_update"],
        summary["unchanged"] or summary["would_unchanged"],
        summary["errors"],
    )
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
