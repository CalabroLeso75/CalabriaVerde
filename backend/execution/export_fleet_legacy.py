"""
Esporta il parco macchine legacy da una sorgente MySQL compatibile.

Output:
- vehicle_types.json
- vehicles.json
- vehicle_revisions.json
- vehicle_logs.json
- aib_team_vehicles.json
- manifest.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

from common.bundle import write_json
from common.db import connect_mysql, env_value


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT_DIR / ".tmp" / "project_completion" / "collaudo" / "fleet_import" / "source_bundle"


def main() -> int:
    parser = argparse.ArgumentParser(description="Esporta il parco macchine dal DB legacy.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Cartella di output del bundle.")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    tables = {
        "vehicle_types.json": "SELECT * FROM vehicle_types ORDER BY id",
        "vehicles.json": "SELECT * FROM vehicles ORDER BY targa, id",
        "vehicle_revisions.json": "SELECT * FROM vehicle_revisions ORDER BY vehicle_id, data_revisione, id",
        "vehicle_logs.json": "SELECT * FROM vehicle_logs ORDER BY vehicle_id, assegnato_il, id",
        "aib_team_vehicles.json": "SELECT * FROM aib_team_vehicles ORDER BY team_id, vehicle_id, id",
    }

    manifest: dict[str, object] = {
        "source_db": env_value("IMPORT_FLEET_SRC_DB", "gestionale_cv"),
        "tables": {},
    }

    with connect_mysql(
        host_env="IMPORT_FLEET_SRC_HOST",
        port_env="IMPORT_FLEET_SRC_PORT",
        user_env="IMPORT_FLEET_SRC_USER",
        password_env="IMPORT_FLEET_SRC_PASSWORD",
        database_env="IMPORT_FLEET_SRC_DB",
        default_host="localhost",
        default_port=3306,
        default_user="root",
        default_password="",
        default_database="gestionale_cv",
        autocommit=True,
    ) as conn, conn.cursor() as cur:
        for filename, query in tables.items():
            cur.execute(query)
            rows = cur.fetchall()
            write_json(output_dir / filename, rows)
            manifest["tables"][filename.replace(".json", "")] = {"rows": len(rows), "file": filename}

    write_json(output_dir / "manifest.json", manifest)
    print(f"Bundle fleet esportato in: {output_dir.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
