"""
Importa personale esterno e organizzazioni collegate da un bundle JSON.

Default: dry-run con report in .tmp/project_completion/collaudo/import_personale_esterno/.
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


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUNDLE = ROOT / ".tmp" / "project_completion" / "collaudo" / "import_personale_esterno" / "source_bundle"
DEFAULT_REPORT_DIR = ROOT / ".tmp" / "project_completion" / "collaudo" / "import_personale_esterno" / "run"


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


def describe_columns(cur: pymysql.cursors.DictCursor, table: str) -> set[str]:
    cur.execute(f"DESCRIBE {table}")
    return {row["Field"] for row in cur.fetchall()}


def clean(value: Any, limit: int | None = None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit] if limit else text


def normalize_cf(value: Any) -> str | None:
    text = clean(value, 16)
    return text.upper() if text else None


def normalize_email(value: Any) -> str | None:
    text = clean(value, 255)
    return text.lower() if text else None


def normalize_gender(value: Any) -> str | None:
    text = (clean(value, 2) or "").upper()
    return text if text in {"M", "F", "NB"} else None


def parse_date(value: Any) -> date | None:
    text = clean(value)
    if not text:
        return None
    return date.fromisoformat(text[:10])


def infer_status(end_date: date | None) -> str:
    if end_date and end_date < date.today():
        return "cessato"
    return "in_servizio"


def infer_contract_type(start_date: date | None, end_date: date | None) -> str:
    if end_date:
        return "stagionale"
    if start_date:
        return "collaborazione"
    return "collaborazione"


def make_org_code(source_id: int) -> str:
    return f"EXT{int(source_id):03d}"[:20]


def org_note(row: dict[str, Any]) -> str:
    parts = [
        "Import legacy organizzazione esterna",
        f"id legacy={row['id']}",
        f"tipo legacy={row.get('type') or 'n/d'}",
    ]
    if row.get("service_area"):
        parts.append(f"ambito={row['service_area']}")
    if row.get("contract_reference"):
        parts.append(f"contratto={row['contract_reference']}")
    return " | ".join(parts)


def ensure_organizations(
    cur: pymysql.cursors.DictCursor,
    rows: list[dict[str, Any]],
    apply: bool,
    anomalies: list[dict[str, Any]],
) -> dict[int, int]:
    mapping: dict[int, int] = {}
    org_columns = describe_columns(cur, "organizations")
    for row in rows:
        source_id = int(row["id"])
        code = make_org_code(source_id)
        cur.execute("SELECT id FROM organizations WHERE code=%s LIMIT 1", (code,))
        existing = cur.fetchone()
        payload = {
            "code": code,
            "name": clean(row.get("name"), 200) or f"Organizzazione esterna {source_id}",
            "type": "postazione",
            "address": clean(row.get("address"), 300),
            "phone": clean(row.get("phone"), 20),
            "email": normalize_email(row.get("email")),
            "pec": normalize_email(row.get("pec")),
            "is_active": 1,
            "is_temporary": 0,
            "notes": org_note(row),
        }
        if existing:
            mapping[source_id] = int(existing["id"])
            if apply:
                update_fields = []
                values: list[Any] = []
                for field in ("name", "type", "address", "phone", "email", "pec", "is_active", "is_temporary", "notes"):
                    if field in org_columns:
                        update_fields.append(f"{field}=%s")
                        values.append(payload[field])
                update_fields.append("updated_at=NOW()")
                values.append(mapping[source_id])
                cur.execute(f"UPDATE organizations SET {', '.join(update_fields)} WHERE id=%s", values)
            continue

        if apply:
            insert_columns = [field for field in ("code", "name", "type", "address", "phone", "email", "pec", "is_active", "is_temporary", "notes") if field in org_columns]
            placeholders = ", ".join(["%s"] * len(insert_columns))
            cur.execute(
                f"""
                INSERT INTO organizations
                ({', '.join(insert_columns)}, created_at, updated_at)
                VALUES ({placeholders}, NOW(), NOW())
                """,
                [payload[field] for field in insert_columns],
            )
            mapping[source_id] = int(cur.lastrowid)
        else:
            mapping[source_id] = -source_id

        anomalies.append({
            "tipo": "organization",
            "source_id": source_id,
            "codice_fiscale": "",
            "matricola": "",
            "messaggio": f"Organizzazione esterna predisposta con code={code}",
        })
    return mapping


def build_employee(row: dict[str, Any], org_map: dict[int, int]) -> dict[str, Any]:
    end_date = parse_date(row.get("end_date"))
    start_date = parse_date(row.get("start_date"))
    organization_id = org_map.get(int(row["organization_id"])) if row.get("organization_id") is not None else None
    return {
        "tipo": "esterno",
        "codice_fiscale": normalize_cf(row.get("tax_code")),
        "nome": (clean(row.get("first_name"), 100) or "").title(),
        "cognome": (clean(row.get("last_name"), 100) or "").title(),
        "genere": normalize_gender(row.get("gender")),
        "data_nascita": parse_date(row.get("birth_date")),
        "luogo_nascita": clean(row.get("birth_place_text"), 100),
        "mansione": clean(row.get("job_title"), 200),
        "tipo_contratto": infer_contract_type(start_date, end_date),
        "data_assunzione": start_date,
        "data_fine_contratto": end_date,
        "stato": infer_status(end_date),
        "organization_id": organization_id,
        "is_aib_qualificato": int(bool(row.get("is_aib"))),
        "is_dos": int(bool(row.get("is_dos"))),
        "is_emergency_available": int(bool(row.get("is_emergency_available"))),
        "is_emergency_coordinator": int(bool(row.get("is_emergency_coordinator"))),
        "is_operations_room_manager": int(bool(row.get("is_operations_room_manager"))),
        "is_operations_room_operator": int(bool(row.get("is_operations_room_operator"))),
        "is_mechanical_operator": int(bool(row.get("is_mechanical_operator"))),
        "is_aib_pc_operator": int(bool(row.get("is_aib_pc_operator"))),
        "is_pc_operator": int(bool(row.get("is_pc_operator"))),
        "is_driver": int(bool(row.get("is_driver"))),
        "stato_quiescenza": "non_verificata",
        "ente_provenienza": None,
        "note": clean(row.get("notes"), 1000),
    }


def comparable(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa personale esterno da bundle JSON.")
    parser.add_argument("--bundle-dir", default=str(DEFAULT_BUNDLE), help="Cartella bundle sorgente.")
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR), help="Cartella report.")
    parser.add_argument("--apply", action="store_true", help="Applica davvero le modifiche al DB.")
    args = parser.parse_args()

    bundle_dir = Path(args.bundle_dir)
    report_dir = Path(args.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)

    organizations = load_json(bundle_dir / "organizations.json")
    employees = load_json(bundle_dir / "external_employees.json")

    summary: dict[str, Any] = {
        "mode": "apply" if args.apply else "dry-run",
        "source_organizations": len(organizations),
        "source_employees": len(employees),
        "organizations_prepared": 0,
        "employees_inserted": 0,
        "employees_updated": 0,
        "employees_unchanged": 0,
        "employees_skipped": 0,
        "errors": 0,
        "started_at": datetime.now().isoformat(timespec="seconds"),
        "finished_at": None,
    }
    anomalies: list[dict[str, Any]] = []
    changes: list[dict[str, Any]] = []

    employee_columns = [
        "tipo", "codice_fiscale", "nome", "cognome", "genere", "data_nascita", "luogo_nascita",
        "mansione", "tipo_contratto", "data_assunzione", "data_fine_contratto", "stato",
        "organization_id", "is_aib_qualificato", "is_dos", "is_emergency_available",
        "is_emergency_coordinator", "is_operations_room_manager", "is_operations_room_operator",
        "is_mechanical_operator", "is_aib_pc_operator", "is_pc_operator", "is_driver",
        "stato_quiescenza", "ente_provenienza", "note",
    ]

    with connect() as conn, conn.cursor() as cur:
        org_map = ensure_organizations(cur, organizations, args.apply, anomalies)
        summary["organizations_prepared"] = len(org_map)

        for row in employees:
            try:
                incoming = build_employee(row, org_map)
                cf = incoming["codice_fiscale"]
                if not cf:
                    summary["employees_skipped"] += 1
                    anomalies.append({
                        "tipo": "skip",
                        "source_id": row.get("id"),
                        "codice_fiscale": "",
                        "matricola": "",
                        "messaggio": "Codice fiscale mancante",
                    })
                    continue

                cur.execute("SELECT * FROM employees WHERE codice_fiscale=%s LIMIT 1", (cf,))
                existing = cur.fetchone()

                if existing:
                    diff = {}
                    for column in employee_columns:
                        if comparable(existing.get(column)) != comparable(incoming.get(column)):
                            diff[column] = (comparable(existing.get(column)), comparable(incoming.get(column)))
                    if not diff:
                        summary["employees_unchanged"] += 1
                        continue

                    if existing.get("tipo") != "esterno":
                        summary["employees_skipped"] += 1
                        anomalies.append({
                            "tipo": "skip",
                            "source_id": row.get("id"),
                            "codice_fiscale": cf,
                            "matricola": "",
                            "messaggio": "Codice fiscale gia' associato a record non esterno",
                        })
                        continue

                    for field, value in diff.items():
                        changes.append({
                            "source_id": row.get("id"),
                            "codice_fiscale": cf,
                            "matricola": "",
                            "campo": field,
                            "valore_attuale": value[0],
                            "valore_import": value[1],
                        })

                    if args.apply:
                        assignments = ", ".join(f"{column}=%s" for column in employee_columns if column != "codice_fiscale")
                        values = [incoming[column] for column in employee_columns if column != "codice_fiscale"]
                        values.append(cf)
                        cur.execute(f"UPDATE employees SET {assignments}, updated_at=NOW() WHERE codice_fiscale=%s", values)
                    summary["employees_updated"] += 1
                    continue

                if args.apply:
                    placeholders = ", ".join(["%s"] * len(employee_columns))
                    cur.execute(
                        f"""
                        INSERT INTO employees ({', '.join(employee_columns)}, created_at, updated_at)
                        VALUES ({placeholders}, NOW(), NOW())
                        """,
                        [incoming[column] for column in employee_columns],
                    )
                summary["employees_inserted"] += 1

            except Exception as exc:
                summary["errors"] += 1
                anomalies.append({
                    "tipo": "error",
                    "source_id": row.get("id"),
                    "codice_fiscale": normalize_cf(row.get("tax_code")) or "",
                    "matricola": "",
                    "messaggio": str(exc),
                })

        if args.apply and summary["errors"] == 0:
            conn.commit()
        else:
            conn.rollback()

        cur.execute("SELECT tipo, COUNT(*) AS count FROM employees GROUP BY tipo ORDER BY tipo")
        summary["destination_by_type"] = cur.fetchall()

    summary["finished_at"] = datetime.now().isoformat(timespec="seconds")
    (report_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    write_csv(report_dir / "anomalie.csv", anomalies, ["tipo", "source_id", "codice_fiscale", "matricola", "messaggio"])
    write_csv(report_dir / "differenze.csv", changes, ["source_id", "codice_fiscale", "matricola", "campo", "valore_attuale", "valore_import"])

    print(json.dumps(summary, ensure_ascii=False, indent=2, default=str))
    return 0 if summary["errors"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
