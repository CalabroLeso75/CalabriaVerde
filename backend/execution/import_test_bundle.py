"""
Importa un bundle JSON nel database FastAPI dell'ambiente Test.
"""
from __future__ import annotations

import argparse
import json
import os
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
]

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT_DIR / ".tmp" / "project_completion" / "test" / "db_bundle"


def connect() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "gestionale_cv_test"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def import_bundle(input_dir: Path) -> None:
    manifest_path = input_dir / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest non trovato: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS=0")
            for table in reversed(TABLES):
                cur.execute(f"DELETE FROM {table}")

            for table in TABLES:
                table_info = manifest["tables"].get(table)
                if not table_info:
                    continue

                payload_path = input_dir / table_info["file"]
                rows: list[dict[str, Any]] = json.loads(payload_path.read_text(encoding="utf-8"))
                if not rows:
                    continue

                if table == "organizations":
                    seen_codes: set[str] = set()
                    normalized_rows: list[dict[str, Any]] = []
                    for row in rows:
                        current = dict(row)
                        code = current.get("code")
                        row_id = current.get("id")
                        if code in seen_codes and row_id is not None:
                            current["code"] = f"{code}-{row_id}"
                        seen_codes.add(current.get("code"))
                        normalized_rows.append(current)
                    rows = normalized_rows

                cur.execute(f"SHOW COLUMNS FROM {table}")
                available_columns = {row["Field"] for row in cur.fetchall()}
                columns = [column for column in rows[0].keys() if column in available_columns]
                if not columns:
                    continue

                placeholders = ", ".join(["%s"] * len(columns))
                column_sql = ", ".join(f"`{column}`" for column in columns)
                sql = f"INSERT INTO {table} ({column_sql}) VALUES ({placeholders})"
                values = [tuple(row.get(column) for column in columns) for row in rows]
                cur.executemany(sql, values)

            cur.execute("SET FOREIGN_KEY_CHECKS=1")
        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa il bundle dati nell'ambiente Test.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Cartella contenente manifest e JSON.")
    args = parser.parse_args()
    import_bundle(args.input.resolve())
    print(f"Bundle importato da: {args.input.resolve()}")


if __name__ == "__main__":
    main()
