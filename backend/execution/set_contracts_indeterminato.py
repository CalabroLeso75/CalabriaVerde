"""
Imposta tutti i dipendenti del collaudo a tempo indeterminato.

Default: dry-run. Con --apply esegue l'aggiornamento e salva report in .tmp.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import pymysql


ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = ROOT / ".tmp" / "project_completion" / "collaudo" / "contratti"


def connect() -> pymysql.Connection:
    return pymysql.connect(
        host=os.getenv("IMPORT_DST_HOST", os.getenv("DB_HOST", "localhost")),
        port=int(os.getenv("IMPORT_DST_PORT", os.getenv("DB_PORT", "3306"))),
        user=os.getenv("IMPORT_DST_USER", os.getenv("DB_USER", "root")),
        password=os.getenv("IMPORT_DST_PASSWORD", "" if os.getenv("LOCAL_DB_NO_PASSWORD", "").lower() == "true" else os.getenv("DB_PASSWORD", "")),
        database=os.getenv("IMPORT_DST_DB", os.getenv("DB_NAME", "gestionale_cv")),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def fetch_distribution(conn: pymysql.Connection) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute("SELECT tipo_contratto, COUNT(*) AS count FROM employees GROUP BY tipo_contratto ORDER BY count DESC")
        return cur.fetchall()


def main() -> int:
    parser = argparse.ArgumentParser(description="Imposta tutti i contratti a indeterminato.")
    parser.add_argument("--apply", action="store_true", help="Scrive davvero sul database.")
    args = parser.parse_args()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        before = fetch_distribution(conn)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS count FROM employees WHERE tipo_contratto <> 'indeterminato' OR tipo_contratto IS NULL")
            affected = cur.fetchone()["count"]
            if args.apply:
                cur.execute("UPDATE employees SET tipo_contratto='indeterminato', updated_at=NOW()")
                updated = cur.rowcount
                conn.commit()
            else:
                updated = 0
                conn.rollback()
        after = fetch_distribution(conn)

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "records_to_change": affected,
        "records_updated": updated,
        "before": before,
        "after": after,
    }
    (REPORT_DIR / "set_indeterminato_summary.json").write_text(json.dumps(report, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
