"""
Esporta personale esterno e organizzazioni collegate da un DB legacy.

Output:
- external_employees.json
- organizations.json
- manifest.json
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, time
from pathlib import Path
from typing import Any

import pymysql


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / ".tmp" / "project_completion" / "collaudo" / "import_personale_esterno" / "source_bundle"


def env(name: str, default: str) -> str:
    return os.getenv(name, default)


def connect() -> pymysql.Connection:
    return pymysql.connect(
        host=env("IMPORT_EXT_SRC_HOST", "localhost"),
        port=int(env("IMPORT_EXT_SRC_PORT", "3306")),
        user=env("IMPORT_EXT_SRC_USER", "root"),
        password=env("IMPORT_EXT_SRC_PASSWORD", ""),
        database=env("IMPORT_EXT_SRC_DB", "gestionale_cv"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    raise TypeError(f"Unsupported type: {type(value)!r}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Esporta personale esterno dal DB legacy.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Cartella di output del bundle.")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                ee.id,
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
                ee.created_at,
                ee.updated_at
            FROM external_employees ee
            ORDER BY ee.last_name, ee.first_name, ee.id
            """
        )
        employees = cur.fetchall()

        cur.execute(
            """
            SELECT DISTINCT organization_id
            FROM external_employees
            WHERE organization_id IS NOT NULL
            ORDER BY organization_id
            """
        )
        organization_ids = [row["organization_id"] for row in cur.fetchall()]

        organizations: list[dict[str, Any]] = []
        if organization_ids:
            placeholders = ", ".join(["%s"] * len(organization_ids))
            cur.execute(
                f"""
                SELECT
                    id,
                    name,
                    type,
                    service_area,
                    tax_code,
                    vat_number,
                    is_aib,
                    is_helicopter_service_provider,
                    email,
                    pec,
                    phone,
                    website,
                    city_id,
                    address,
                    legal_representative,
                    contract_reference,
                    contract_notes,
                    created_at,
                    updated_at
                FROM organizations
                WHERE id IN ({placeholders})
                ORDER BY id
                """,
                organization_ids,
            )
            organizations = cur.fetchall()

    payloads = {
        "external_employees.json": employees,
        "organizations.json": organizations,
        "manifest.json": {
            "source_db": env("IMPORT_EXT_SRC_DB", "gestionale_cv"),
            "employees": len(employees),
            "organizations": len(organizations),
        },
    }

    for filename, payload in payloads.items():
        (output_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, default=json_default),
            encoding="utf-8",
        )

    print(f"Bundle esterni esportato in: {output_dir.resolve()}")
    print(f"Organizzazioni: {len(organizations)} | Esterni: {len(employees)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
