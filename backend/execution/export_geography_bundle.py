from pathlib import Path

from common.bundle import write_json
from common.db import connect_mysql, env_value


TABLES = [
    "geo_countries",
    "geo_regions",
    "geo_provinces",
    "geo_municipalities",
    "geo_province_boundaries",
    "geo_municipality_boundaries",
    "geo_calabria_toponyms",
]
def main():
    output_dir = Path(env_value("GEO_BUNDLE_OUTPUT", ".tmp/project_completion/test/geography_bundle"))
    output_dir.mkdir(parents=True, exist_ok=True)

    conn = connect_mysql(
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
        autocommit=False,
        password_can_be_disabled=True,
    )
    cur = conn.cursor()
    summary: dict[str, int] = {}
    try:
      for table in TABLES:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        write_json(output_dir / f"{table}.json", rows)
        summary[table] = len(rows)
    finally:
      cur.close()
      conn.close()

    write_json(output_dir / "manifest.json", summary)
    print(summary)


if __name__ == "__main__":
    main()
