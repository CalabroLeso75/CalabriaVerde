import json
import os
from pathlib import Path

import pymysql


TABLES = [
    "geo_countries",
    "geo_regions",
    "geo_provinces",
    "geo_municipalities",
    "geo_province_boundaries",
    "geo_municipality_boundaries",
    "geo_calabria_toponyms",
]


def connect():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "gestionale_cv"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def main():
    output_dir = Path(os.getenv("GEO_BUNDLE_OUTPUT", ".tmp/project_completion/test/geography_bundle"))
    output_dir.mkdir(parents=True, exist_ok=True)

    conn = connect()
    cur = conn.cursor()
    summary: dict[str, int] = {}
    try:
      for table in TABLES:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        (output_dir / f"{table}.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
        summary[table] = len(rows)
    finally:
      cur.close()
      conn.close()

    (output_dir / "manifest.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
