import argparse
import json
import os
from pathlib import Path

import pymysql


DEFAULT_REPORT_DIR = Path(".tmp/project_completion/collaudo/geography_import")

PROVINCE_REGION_RANGES = [
    (1, 8, 1),     # Piemonte
    (9, 9, 2),     # Valle d'Aosta
    (10, 21, 3),   # Lombardia
    (22, 23, 4),   # Trentino-Alto Adige
    (24, 30, 5),   # Veneto
    (31, 34, 6),   # Friuli-Venezia Giulia
    (35, 38, 7),   # Liguria
    (39, 47, 8),   # Emilia-Romagna
    (48, 57, 9),   # Toscana
    (58, 59, 10),  # Umbria
    (60, 64, 11),  # Marche
    (65, 69, 12),  # Lazio
    (70, 73, 13),  # Abruzzo
    (74, 75, 14),  # Molise
    (76, 80, 15),  # Campania
    (81, 86, 16),  # Puglia
    (87, 88, 17),  # Basilicata
    (89, 93, 18),  # Calabria
    (94, 102, 19), # Sicilia
    (103, 107, 20),# Sardegna
]


def connect(database: str):
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def detect_columns(cursor, table_name: str):
    cursor.execute(f"DESCRIBE {table_name}")
    return {row["Field"] for row in cursor.fetchall()}


def province_region_source_id(province_source_id: int | None) -> int | None:
    if province_source_id is None:
        return None
    for start, end, region_id in PROVINCE_REGION_RANGES:
        if start <= province_source_id <= end:
            return region_id
    return None


def optional_table_name(env_name: str) -> str | None:
    value = os.getenv(env_name, "").strip()
    return value or None


def import_core(src, dst, dry_run: bool, summary: dict):
    src_cur = src.cursor()
    dst_cur = dst.cursor()

    src_cur.execute("SELECT id, name_it, iso2, cadastral_code, valid_from, valid_to, slug FROM foreign_states ORDER BY name_it")
    countries = src_cur.fetchall()
    src_cur.execute("SELECT id, name, istat_code FROM it_regions ORDER BY id")
    regions = src_cur.fetchall()
    src_cur.execute("SELECT id, name, short_code, istat_code FROM it_provinces ORDER BY id")
    provinces = src_cur.fetchall()
    src_cur.execute("SELECT id, name, istat_code, province_id, cadastral_code, status, valid_from, valid_to FROM it_municipalities ORDER BY id")
    municipalities = src_cur.fetchall()

    summary["source_countries"] = len(countries)
    summary["source_regions"] = len(regions)
    summary["source_provinces"] = len(provinces)
    summary["source_municipalities"] = len(municipalities)

    if dry_run:
        return

    dst_cur.execute("DELETE FROM geo_calabria_toponyms")
    dst_cur.execute("DELETE FROM geo_municipality_boundaries")
    dst_cur.execute("DELETE FROM geo_province_boundaries")
    dst_cur.execute("DELETE FROM geo_municipalities")
    dst_cur.execute("DELETE FROM geo_provinces")
    dst_cur.execute("DELETE FROM geo_regions")
    dst_cur.execute("DELETE FROM geo_countries")

    dst_cur.execute(
        """
        INSERT INTO geo_countries
        (name, iso2, cadastral_code, slug, valid_from, valid_to, is_italy, is_active, created_at, updated_at)
        VALUES
        (%s, %s, %s, %s, NULL, NULL, 1, 1, NOW(), NOW())
        """,
        ("Italia", "IT", "Z000", "italia"),
    )
    italy_id = dst_cur.lastrowid

    country_id_map: dict[int, int] = {}
    for row in countries:
        dst_cur.execute(
            """
            INSERT INTO geo_countries
            (name, iso2, cadastral_code, slug, valid_from, valid_to, is_italy, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 0, 1, NOW(), NOW())
            """,
            (
                row["name_it"],
                row.get("iso2"),
                row.get("cadastral_code"),
                row.get("slug"),
                row.get("valid_from"),
                row.get("valid_to"),
            ),
        )
        country_id_map[row["id"]] = dst_cur.lastrowid

    region_id_map: dict[int, int] = {}
    for row in regions:
        code = f"{row['id']:02d}"
        dst_cur.execute(
            """
            INSERT INTO geo_regions
            (country_id, source_id, name, code, sort_order, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
            """,
            (italy_id, row["id"], row["name"], code, row["id"]),
        )
        region_id_map[row["id"]] = dst_cur.lastrowid

    province_id_map: dict[int, int] = {}
    for row in provinces:
        region_source_id = province_region_source_id(row["id"])
        region_id = region_id_map.get(region_source_id)
        if not region_id:
            summary["warnings"].append(f"Provincia sorgente {row['name']} senza regione derivabile")
            continue
        dst_cur.execute(
            """
            INSERT INTO geo_provinces
            (region_id, source_id, name, code, istat_code, vehicle_code, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 1, NOW(), NOW())
            """,
            (
                region_id,
                row["id"],
                row["name"],
                row.get("short_code"),
                row.get("istat_code"),
                row.get("short_code"),
            ),
        )
        province_id_map[row["id"]] = dst_cur.lastrowid

    for row in municipalities:
        province_id = province_id_map.get(row.get("province_id"))
        if not province_id:
            summary["warnings"].append(f"Comune sorgente {row['name']} senza provincia mappata")
            continue
        dst_cur.execute(
            """
            INSERT INTO geo_municipalities
            (province_id, source_id, name, istat_code, cadastral_code, status, valid_from, valid_to, latitude, longitude, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL, NULL, 1, NOW(), NOW())
            """,
            (
                province_id,
                row["id"],
                row["name"],
                row.get("istat_code"),
                row.get("cadastral_code"),
                row.get("status"),
                row.get("valid_from"),
                row.get("valid_to"),
            ),
        )

    summary["imported_countries"] = len(countries) + 1
    summary["imported_regions"] = len(region_id_map)
    summary["imported_provinces"] = len(province_id_map)
    summary["imported_municipalities"] = len(municipalities)


def import_optional_boundaries(src, dst, dry_run: bool, summary: dict):
    municipality_table = optional_table_name("GEO_SOURCE_MUNICIPAL_BOUNDARIES_TABLE")
    province_table = optional_table_name("GEO_SOURCE_PROVINCE_BOUNDARIES_TABLE")
    toponym_table = optional_table_name("GEO_SOURCE_CALABRIA_TOPONYMS_TABLE")

    for env_name, table_name in [
        ("GEO_SOURCE_MUNICIPAL_BOUNDARIES_TABLE", municipality_table),
        ("GEO_SOURCE_PROVINCE_BOUNDARIES_TABLE", province_table),
        ("GEO_SOURCE_CALABRIA_TOPONYMS_TABLE", toponym_table),
    ]:
        if not table_name:
            summary["warnings"].append(f"{env_name} non configurata: import opzionale saltato")

    if dry_run:
        return

    src_cur = src.cursor()
    dst_cur = dst.cursor()

    if province_table:
        try:
            cols = detect_columns(src_cur, province_table)
            name_col = "name" if "name" in cols else ("nome" if "nome" in cols else None)
            geom_col = "geometry_geojson" if "geometry_geojson" in cols else ("geojson" if "geojson" in cols else None)
            code_col = "province_code" if "province_code" in cols else ("sigla" if "sigla" in cols else None)
            lat_col = "centroid_latitude" if "centroid_latitude" in cols else ("lat" if "lat" in cols else None)
            lon_col = "centroid_longitude" if "centroid_longitude" in cols else ("lon" if "lon" in cols else None)
            if name_col and code_col:
                src_cur.execute(f"SELECT * FROM {province_table}")
                rows = src_cur.fetchall()
                for row in rows:
                    dst_cur.execute("SELECT id FROM geo_provinces WHERE code=%s LIMIT 1", (row.get(code_col),))
                    province = dst_cur.fetchone()
                    if not province:
                        continue
                    dst_cur.execute(
                        """
                        INSERT INTO geo_province_boundaries
                        (province_id, source_name, geometry_geojson, centroid_latitude, centroid_longitude, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (
                            province["id"],
                            row.get(name_col),
                            row.get(geom_col) if geom_col else None,
                            row.get(lat_col) if lat_col else None,
                            row.get(lon_col) if lon_col else None,
                        ),
                    )
                summary["imported_province_boundaries"] = len(rows)
        except Exception as exc:
            summary["warnings"].append(f"Import confini province saltato: {exc}")

    if municipality_table:
        try:
            cols = detect_columns(src_cur, municipality_table)
            code_col = "cadastral_code" if "cadastral_code" in cols else ("codice_catastale" if "codice_catastale" in cols else None)
            name_col = "name" if "name" in cols else ("nome" if "nome" in cols else None)
            geom_col = "geometry_geojson" if "geometry_geojson" in cols else ("geojson" if "geojson" in cols else None)
            lat_col = "centroid_latitude" if "centroid_latitude" in cols else ("lat" if "lat" in cols else None)
            lon_col = "centroid_longitude" if "centroid_longitude" in cols else ("lon" if "lon" in cols else None)
            if code_col:
                src_cur.execute(f"SELECT * FROM {municipality_table}")
                rows = src_cur.fetchall()
                for row in rows:
                    dst_cur.execute("SELECT id FROM geo_municipalities WHERE cadastral_code=%s LIMIT 1", (row.get(code_col),))
                    municipality = dst_cur.fetchone()
                    if not municipality:
                        continue
                    dst_cur.execute(
                        """
                        INSERT INTO geo_municipality_boundaries
                        (municipality_id, source_name, geometry_geojson, centroid_latitude, centroid_longitude, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (
                            municipality["id"],
                            row.get(name_col) if name_col else None,
                            row.get(geom_col) if geom_col else None,
                            row.get(lat_col) if lat_col else None,
                            row.get(lon_col) if lon_col else None,
                        ),
                    )
                summary["imported_municipality_boundaries"] = len(rows)
        except Exception as exc:
            summary["warnings"].append(f"Import confini comuni saltato: {exc}")

    if toponym_table:
        try:
            cols = detect_columns(src_cur, toponym_table)
            name_col = "name" if "name" in cols else ("nome" if "nome" in cols else None)
            lat_col = "latitude" if "latitude" in cols else ("lat" if "lat" in cols else None)
            lon_col = "longitude" if "longitude" in cols else ("lon" if "lon" in cols else None)
            mun_code_col = "cadastral_code" if "cadastral_code" in cols else ("codice_catastale" if "codice_catastale" in cols else None)
            prov_code_col = "province_code" if "province_code" in cols else ("sigla_provincia" if "sigla_provincia" in cols else None)
            note_col = "notes" if "notes" in cols else ("note" if "note" in cols else None)
            if name_col and lat_col and lon_col:
                src_cur.execute(f"SELECT * FROM {toponym_table}")
                rows = src_cur.fetchall()
                for row in rows:
                    municipality_id = None
                    province_id = None
                    if mun_code_col and row.get(mun_code_col):
                        dst_cur.execute("SELECT id, province_id FROM geo_municipalities WHERE cadastral_code=%s LIMIT 1", (row.get(mun_code_col),))
                        municipality = dst_cur.fetchone()
                        if municipality:
                            municipality_id = municipality["id"]
                            province_id = municipality["province_id"]
                    elif prov_code_col and row.get(prov_code_col):
                        dst_cur.execute("SELECT id FROM geo_provinces WHERE code=%s LIMIT 1", (row.get(prov_code_col),))
                        province = dst_cur.fetchone()
                        if province:
                            province_id = province["id"]

                    name = str(row.get(name_col)).strip()
                    dst_cur.execute(
                        """
                        INSERT INTO geo_calabria_toponyms
                        (province_id, municipality_id, name, normalized_name, latitude, longitude, source_name, notes, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (
                            province_id,
                            municipality_id,
                            name,
                            name.lower(),
                            row.get(lat_col),
                            row.get(lon_col),
                            toponym_table,
                            row.get(note_col) if note_col else None,
                        ),
                    )
                summary["imported_calabria_toponyms"] = len(rows)
        except Exception as exc:
            summary["warnings"].append(f"Import toponimi Calabria saltato: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Import riferimento geografico nel modulo Geography")
    parser.add_argument("--source-db", default="azienda_local")
    parser.add_argument("--target-db", default="gestionale_cv")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--report-dir", default=str(DEFAULT_REPORT_DIR))
    args = parser.parse_args()

    report_dir = Path(args.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    dry_run = not args.apply

    summary = {
        "mode": "apply" if args.apply else "dry-run",
        "source_db": args.source_db,
        "target_db": args.target_db,
        "warnings": [],
    }

    src = connect(args.source_db)
    dst = connect(args.target_db)
    try:
        import_core(src, dst, dry_run, summary)
        import_optional_boundaries(src, dst, dry_run, summary)
        if args.apply:
            dst.commit()
        else:
            dst.rollback()
    finally:
        src.close()
        dst.close()

    (report_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
