"""
Esporta un bundle JSON del database di collaudo per l'ambiente Test.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, time
from pathlib import Path
from typing import Any

import pymysql


TABLES = [
    "roles",
    "organizations",
    "users",
    "user_roles",
    "employees",
    "employee_qualifications",
    "employee_documents",
    "employee_operational_roles",
    "contract_type_definitions",
    "contract_type_attachments",
    "geo_countries",
    "geo_regions",
    "geo_provinces",
    "geo_municipalities",
    "geo_province_boundaries",
    "geo_municipality_boundaries",
    "geo_calabria_toponyms",
]

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT_DIR / ".tmp" / "project_completion" / "test" / "db_bundle"


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    raise TypeError(f"Unsupported type: {type(value)!r}")


def connect() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password="" if os.getenv("LOCAL_DB_NO_PASSWORD", "").lower() == "true" else os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "gestionale_cv"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def order_clause(columns: list[str]) -> str:
    if "id" in columns:
        return " ORDER BY id"
    if "created_at" in columns:
        return " ORDER BY created_at"
    return ""


def export_bundle(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, Any] = {
        "database": os.getenv("DB_NAME", "gestionale_cv"),
        "tables": {},
    }

    with connect() as conn:
        with conn.cursor() as cur:
            for table in TABLES:
                cur.execute(f"SHOW COLUMNS FROM {table}")
                columns = [row["Field"] for row in cur.fetchall()]
                cur.execute(f"SELECT * FROM {table}{order_clause(columns)}")
                rows = cur.fetchall()

                target = output_dir / f"{table}.json"
                target.write_text(
                    json.dumps(rows, ensure_ascii=False, indent=2, default=json_default),
                    encoding="utf-8",
                )
                manifest["tables"][table] = {
                    "rows": len(rows),
                    "file": target.name,
                }

    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Esporta il bundle dati per l'ambiente Test.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Cartella di output.")
    args = parser.parse_args()
    export_bundle(args.output.resolve())
    print(f"Bundle esportato in: {args.output.resolve()}")


if __name__ == "__main__":
    main()
