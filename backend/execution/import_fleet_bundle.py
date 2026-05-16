"""
Importa il parco macchine da un bundle JSON nel DB di collaudo o test.

Default: dry-run con report in .tmp/project_completion/collaudo/fleet_import/run.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pymysql


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_BUNDLE = ROOT_DIR / ".tmp" / "project_completion" / "collaudo" / "fleet_import" / "source_bundle"
DEFAULT_REPORT_DIR = ROOT_DIR / ".tmp" / "project_completion" / "collaudo" / "fleet_import" / "run"


def env(name: str, default: str) -> str:
    return os.getenv(name, default)


def connect() -> pymysql.Connection:
    password = "" if env("LOCAL_DB_NO_PASSWORD", "").lower() == "true" else env("DB_PASSWORD", "")
    return pymysql.connect(
        host=env("DB_HOST", "localhost"),
        port=int(env("DB_PORT", "3306")),
        user=env("DB_USER", "root"),
        password=password,
        database=env("DB_NAME", "gestionale_cv"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def load_json(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def clean(value: Any, limit: int | None = None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit] if limit else text


def parse_date(value: Any) -> date | None:
    text = clean(value)
    if not text:
        return None
    return date.fromisoformat(text[:10])


def parse_datetime(value: Any) -> datetime | None:
    text = clean(value)
    if not text:
        return None
    return datetime.fromisoformat(text.replace(" ", "T")[:19])


def parse_int(value: Any, default: int | None = 0) -> int | None:
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_catalog_key(value: Any) -> str:
    text = clean(value) or ""
    return " ".join(text.replace("-", " ").replace("_", " ").lower().split())


def map_category(value: Any) -> str:
    normalized = normalize_catalog_key(value)
    if "moto" in normalized:
        return "Motorcycle"
    if "camion" in normalized or "autocarro" in normalized:
        return "Heavy_Duty"
    if "pickup" in normalized or "furg" in normalized:
        return "Light_Commercial"
    return "Car"


def map_engine(value: Any) -> str:
    normalized = normalize_catalog_key(value)
    if "benz" in normalized:
        return "Petrol"
    if "elet" in normalized:
        return "Electric"
    if "plug" in normalized:
        return "Plug-in"
    if "ibrid" in normalized:
        return "Hybrid"
    if "metano" in normalized or "cng" in normalized:
        return "CNG"
    return "Diesel"


def get_or_create_catalog_trim(cur: pymysql.cursors.DictCursor, row: dict[str, Any]) -> int:
    brand_name = clean(row.get("marca"), 120) or "Marca non definita"
    model_name = clean(row.get("modello"), 160) or "Modello non definito"
    normalized_brand = normalize_catalog_key(brand_name)
    normalized_model = normalize_catalog_key(model_name)
    category = map_category(row.get("tipo"))
    engine_type = map_engine(row.get("alimentazione"))
    year = parse_int(row.get("immatricolazione_anno"), None)

    cur.execute("SELECT id FROM vehicle_brands WHERE normalized_name=%s", (normalized_brand,))
    brand = cur.fetchone()
    if brand:
        brand_id = int(brand["id"])
    else:
        cur.execute(
            "INSERT INTO vehicle_brands (name, normalized_name, created_at, updated_at) VALUES (%s, %s, NOW(), NOW())",
            (brand_name, normalized_brand),
        )
        brand_id = int(cur.lastrowid)

    cur.execute(
        "SELECT id FROM vehicle_models WHERE brand_id=%s AND normalized_name=%s",
        (brand_id, normalized_model),
    )
    model = cur.fetchone()
    if model:
        model_id = int(model["id"])
    else:
        cur.execute(
            """
            INSERT INTO vehicle_models (brand_id, name, normalized_name, vehicle_category, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
            """,
            (brand_id, model_name, normalized_model, category),
        )
        model_id = int(cur.lastrowid)

    cur.execute(
        """
        SELECT id FROM vehicle_trims
        WHERE model_id=%s
          AND ((production_year IS NULL AND %s IS NULL) OR production_year=%s)
          AND engine_type=%s
          AND displacement_cc IS NULL
          AND horsepower_hp IS NULL
        """,
        (model_id, year, year, engine_type),
    )
    trim = cur.fetchone()
    if trim:
        return int(trim["id"])
    cur.execute(
        """
        INSERT INTO vehicle_trims (model_id, production_year, engine_type, source, created_at, updated_at)
        VALUES (%s, %s, %s, 'legacy_import', NOW(), NOW())
        """,
        (model_id, year, engine_type),
    )
    return int(cur.lastrowid)


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def find_employee_id(cur: pymysql.cursors.DictCursor, hint: str | None) -> int | None:
    if not hint:
        return None
    text = hint.strip()
    if not text:
        return None
    parts = text.split()
    if len(parts) < 2:
        return None
    cognome = parts[0]
    nome = " ".join(parts[1:])
    cur.execute(
        """
        SELECT id
        FROM employees
        WHERE UPPER(cognome)=%s AND UPPER(nome)=%s
        LIMIT 1
        """,
        (cognome.upper(), nome.upper()),
    )
    row = cur.fetchone()
    return int(row["id"]) if row else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa il parco macchine da bundle JSON.")
    parser.add_argument("--bundle-dir", default=str(DEFAULT_BUNDLE), help="Cartella bundle sorgente.")
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR), help="Cartella report.")
    parser.add_argument("--apply", action="store_true", help="Applica davvero le modifiche al DB.")
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir)
    report_dir = Path(args.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)

    vehicle_types = load_json(bundle_dir / "vehicle_types.json")
    vehicles = load_json(bundle_dir / "vehicles.json")
    revisions = load_json(bundle_dir / "vehicle_revisions.json")
    logs = load_json(bundle_dir / "vehicle_logs.json")
    team_links = load_json(bundle_dir / "aib_team_vehicles.json")

    summary: dict[str, Any] = {
        "mode": "apply" if args.apply else "dry-run",
        "source_vehicle_types": len(vehicle_types),
        "source_vehicles": len(vehicles),
        "source_revisions": len(revisions),
        "source_logs": len(logs),
        "source_team_links": len(team_links),
        "vehicle_types_prepared": 0,
        "vehicles_prepared": 0,
        "revisions_prepared": 0,
        "assignments_prepared": 0,
        "team_links_prepared": 0,
        "errors": 0,
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "finished_at": None,
    }
    anomalies: list[dict[str, Any]] = []

    with connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM organizations ORDER BY id LIMIT 1")
        organization = cur.fetchone()
        default_org_id = int(organization["id"]) if organization else None

        cur.execute("SELECT id, name FROM vehicle_types")
        existing_types = {row["name"].strip().lower(): int(row["id"]) for row in cur.fetchall()}
        type_id_map: dict[int, int] = {}

        for row in vehicle_types:
            legacy_id = int(row["id"])
            name = clean(row.get("name"), 255) or f"Tipologia {legacy_id}"
            existing_id = existing_types.get(name.lower())
            if existing_id:
                type_id_map[legacy_id] = existing_id
                if args.apply:
                    cur.execute(
                        """
                        UPDATE vehicle_types
                        SET documentazione=%s, certificazioni=%s, patente=%s, revisione=%s,
                            assicurazione=%s, tipo_abilitazione=%s, ente_controllo=%s, updated_at=NOW()
                        WHERE id=%s
                        """,
                        (
                            clean(row.get("documentazione")),
                            clean(row.get("certificazioni")),
                            clean(row.get("patente"), 255),
                            clean(row.get("revisione"), 255),
                            clean(row.get("assicurazione"), 255),
                            clean(row.get("tipo_abilitazione"), 255),
                            clean(row.get("ente_controllo"), 255),
                            existing_id,
                        ),
                    )
            else:
                if args.apply:
                    cur.execute(
                        """
                        INSERT INTO vehicle_types
                        (name, documentazione, certificazioni, patente, revisione, assicurazione, tipo_abilitazione, ente_controllo, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (
                            name,
                            clean(row.get("documentazione")),
                            clean(row.get("certificazioni")),
                            clean(row.get("patente"), 255),
                            clean(row.get("revisione"), 255),
                            clean(row.get("assicurazione"), 255),
                            clean(row.get("tipo_abilitazione"), 255),
                            clean(row.get("ente_controllo"), 255),
                        ),
                    )
                    type_id_map[legacy_id] = int(cur.lastrowid)
                else:
                    type_id_map[legacy_id] = -legacy_id
            summary["vehicle_types_prepared"] += 1

        if args.apply:
            cur.execute("DELETE FROM aib_team_vehicles")
            cur.execute("DELETE FROM vehicle_documents")
            cur.execute("DELETE FROM vehicle_incidents")
            cur.execute("DELETE FROM vehicle_logs")
            cur.execute("DELETE FROM vehicle_revisions")
            cur.execute("DELETE FROM vehicles")
            cur.execute("DELETE FROM vehicle_trims")
            cur.execute("DELETE FROM vehicle_models")
            cur.execute("DELETE FROM vehicle_brands")

        vehicle_id_map: dict[int, int] = {}
        for row in vehicles:
            legacy_id = int(row["id"])
            trim_id = get_or_create_catalog_trim(cur, row) if args.apply else -legacy_id
            payload = (
                trim_id,
                type_id_map.get(parse_int(row.get("vehicle_type_id")), None),
                default_org_id,
                clean(row.get("targa"), 255) or f"LEGACY-{legacy_id}",
                clean(row.get("marca"), 255) or "Marca non definita",
                clean(row.get("modello"), 255) or "Modello non definito",
                clean(row.get("tipo"), 255) or "mezzo",
                parse_date(row.get("immatricolazione_date")),
                parse_int(row.get("immatricolazione_mese"), None),
                parse_int(row.get("immatricolazione_anno"), None),
                None,
                None,
                None,
                None,
                None,
                None,
                clean(row.get("assicurazione"), 255),
                None,
                parse_date(row.get("scadenza_assicurazione")),
                None,
                parse_date(row.get("scadenza_revisione")),
                parse_date(row.get("ultima_revisione")),
                parse_date(row.get("scadenza_verifica_sicurezza")),
                parse_date(row.get("rottamazione_date")),
                parse_int(row.get("km_attuali"), 0),
                clean(row.get("stato"), 50) or "operativo",
                0,
                clean(row.get("note")),
            )
            if args.apply:
                cur.execute(
                    """
                    INSERT INTO vehicles
                    (trim_id, vehicle_type_id, organization_id, targa, marca, modello, tipo, immatricolazione_date,
                     immatricolazione_mese, immatricolazione_anno, numero_telaio, alimentazione, euro_classe,
                     colore, proprieta_tipo, localizzazione_corrente, assicurazione_compagnia,
                     assicurazione_polizza, scadenza_assicurazione, assicurazione_copertura, scadenza_revisione,
                     ultima_revisione, scadenza_verifica_sicurezza, rottamazione_date, km_attuali, stato,
                     tracker_enabled, note, created_at, updated_at)
                    VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    payload,
                )
                vehicle_id_map[legacy_id] = int(cur.lastrowid)
            else:
                vehicle_id_map[legacy_id] = -legacy_id
            summary["vehicles_prepared"] += 1

        for row in revisions:
            vehicle_id = vehicle_id_map.get(parse_int(row.get("vehicle_id")))
            if not vehicle_id:
                anomalies.append({"tipo": "revision_skip", "source_id": row.get("id"), "messaggio": "vehicle_id non mappato"})
                continue
            if args.apply:
                cur.execute(
                    """
                    INSERT INTO vehicle_revisions
                    (vehicle_id, data_revisione, esito, km_rilevati, note, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (
                        vehicle_id,
                        parse_date(row.get("data_revisione")) or date.today(),
                        clean(row.get("esito"), 255) or "regolare",
                        parse_int(row.get("km_rilevati"), None),
                        clean(row.get("note")),
                    ),
                )
            summary["revisions_prepared"] += 1

        for row in logs:
            vehicle_id = vehicle_id_map.get(parse_int(row.get("vehicle_id")))
            if not vehicle_id:
                anomalies.append({"tipo": "assignment_skip", "source_id": row.get("id"), "messaggio": "vehicle_id non mappato"})
                continue
            legacy_user_id = parse_int(row.get("user_id"), None)
            note = clean(row.get("note"))
            if legacy_user_id:
                note = f"legacy_user_id={legacy_user_id}" if not note else f"{note} | legacy_user_id={legacy_user_id}"
            if args.apply:
                cur.execute(
                    """
                    INSERT INTO vehicle_logs
                    (vehicle_id, user_id, employee_id, km_iniziali, km_finali, assegnato_il, riconsegnato_il, stato, note, created_at, updated_at)
                    VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (
                        vehicle_id,
                        None,
                        parse_int(row.get("km_iniziali"), 0),
                        parse_int(row.get("km_finali"), None),
                        parse_datetime(row.get("assegnato_il")),
                        parse_datetime(row.get("riconsegnato_il")),
                        "riconsegnato" if row.get("riconsegnato_il") else "assegnato",
                        note,
                    ),
                )
            summary["assignments_prepared"] += 1

        for row in team_links:
            vehicle_id = vehicle_id_map.get(parse_int(row.get("vehicle_id")))
            if not vehicle_id:
                anomalies.append({"tipo": "team_link_skip", "source_id": row.get("id"), "messaggio": "vehicle_id non mappato"})
                continue
            if args.apply:
                cur.execute(
                    """
                    INSERT INTO aib_team_vehicles
                    (effective_from, effective_to, team_id, vehicle_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                    """,
                    (
                        parse_date(row.get("effective_from")),
                        parse_date(row.get("effective_to")),
                        parse_int(row.get("team_id"), 0),
                        vehicle_id,
                    ),
                )
            summary["team_links_prepared"] += 1

        if args.apply and summary["errors"] == 0:
            conn.commit()
        else:
            conn.rollback()

        cur.execute("SELECT COUNT(*) AS total FROM vehicles")
        summary["destination_vehicles"] = int(cur.fetchone()["total"])
        cur.execute("SELECT COUNT(*) AS total FROM vehicle_types")
        summary["destination_vehicle_types"] = int(cur.fetchone()["total"])

    summary["finished_at"] = datetime.now().isoformat(timespec="seconds")
    (report_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    write_csv(report_dir / "anomalie.csv", anomalies, ["tipo", "source_id", "messaggio"])

    print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
