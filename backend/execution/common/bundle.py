from __future__ import annotations

import json
from datetime import date, datetime, time
from pathlib import Path
from typing import Any


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    raise TypeError(f"Unsupported type: {type(value)!r}")


def order_clause(columns: list[str]) -> str:
    if "id" in columns:
        return " ORDER BY id"
    if "created_at" in columns:
        return " ORDER BY created_at"
    return ""


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, default=json_default),
        encoding="utf-8",
    )


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))
