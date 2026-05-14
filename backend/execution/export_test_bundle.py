"""
Esporta un bundle JSON del database di collaudo per l'ambiente Test.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from common.bundle import order_clause, write_json
from common.db import connect_mysql, env_value


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
    "vehicle_types",
    "vehicles",
    "fleet_groups",
    "fleet_group_members",
    "vehicle_insurance_records",
    "vehicle_revisions",
    "vehicle_logs",
    "vehicle_usage_logs",
    "vehicle_alerts",
    "vehicle_incidents",
    "vehicle_documents",
    "aib_team_vehicles",
    "communication_targets",
    "communication_logs",
    "communication_recipients",
]

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT_DIR / ".tmp" / "project_completion" / "test" / "db_bundle"


def export_bundle(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "database": env_value("DB_NAME", "gestionale_cv"),
        "tables": {},
    }

    with connect_mysql(
        host_env="DB_HOST",
        port_env="DB_PORT",
        user_env="DB_USER",
        password_env="DB_PASSWORD",
        database_env="DB_NAME",
        default_host="localhost",
        default_port=3306,
        default_user="root",
        default_password="",
        default_database="gestionale_cv",
        autocommit=True,
        password_can_be_disabled=True,
    ) as conn:
        with conn.cursor() as cur:
            for table in TABLES:
                cur.execute(f"SHOW COLUMNS FROM {table}")
                columns = [row["Field"] for row in cur.fetchall()]
                cur.execute(f"SELECT * FROM {table}{order_clause(columns)}")
                rows = cur.fetchall()

                target = output_dir / f"{table}.json"
                write_json(target, rows)
                manifest["tables"][table] = {
                    "rows": len(rows),
                    "file": target.name,
                }

    write_json(output_dir / "manifest.json", manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description="Esporta il bundle dati per l'ambiente Test.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Cartella di output.")
    args = parser.parse_args()
    export_bundle(args.output.resolve())
    print(f"Bundle esportato in: {args.output.resolve()}")


if __name__ == "__main__":
    main()
