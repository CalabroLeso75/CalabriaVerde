"""Lookup targa conforme per il livello execution.

Questo modulo evita scraping di portali con CAPTCHA/anti-bot. Accetta dati
da fonti lecite e controllabili: input manuale, CSV/Excel, provider API
autorizzati. Restituisce una struttura unica riusabile dal backend.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PlateLookupResult:
    status: str
    targa: str
    source: str
    dati: dict[str, Any]
    message: str | None = None


def normalize_plate(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def normalize_row(row: dict[str, Any], source: str = "csv_convenzionale") -> PlateLookupResult:
    plate = normalize_plate(str(row.get("targa") or row.get("license_plate") or ""))
    if not plate:
        return PlateLookupResult(
            status="error",
            targa="",
            source=source,
            dati={},
            message="Targa mancante",
        )

    data = {
        "marca": row.get("marca") or row.get("brand_name"),
        "modello": row.get("modello") or row.get("model_name"),
        "categoria": row.get("categoria") or row.get("vehicle_category"),
        "anno": row.get("anno") or row.get("production_year"),
        "alimentazione": row.get("alimentazione") or row.get("engine_type"),
        "cilindrata": row.get("cilindrata_cc") or row.get("displacement_cc"),
        "cavalli": row.get("cavalli_cv") or row.get("horsepower_hp"),
        "classe_ambientale": row.get("euro") or row.get("euro_class"),
        "vin": row.get("vin") or row.get("vin_code"),
        "gomme_default": row.get("gomme_default") or row.get("tire_size"),
        "km": row.get("km") or row.get("km_attuali"),
        "assicurazione": {
            "compagnia": row.get("compagnia") or row.get("insurance_company"),
            "polizza": row.get("polizza") or row.get("insurance_policy"),
            "scadenza": row.get("scadenza_assicurazione") or row.get("insurance_due"),
        },
        "revisione": {
            "scadenza": row.get("scadenza_revisione") or row.get("revision_due"),
        },
        "note": row.get("note"),
    }
    return PlateLookupResult(status="success", targa=plate, source=source, dati=data)


def lookup_from_csv(csv_path: Path, plate: str) -> PlateLookupResult:
    target_plate = normalize_plate(plate)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(2048)
        handle.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=";,")
        reader = csv.DictReader(handle, dialect=dialect)
        for row in reader:
            result = normalize_row(row)
            if result.targa == target_plate:
                return result
    return PlateLookupResult(
        status="not_found",
        targa=target_plate,
        source="csv_convenzionale",
        dati={},
        message="Targa non trovata nel file indicato",
    )


def get_dati_targa(targa: str, csv_path: str | None = None) -> dict[str, Any]:
    """Restituisce dati targa solo da fonti autorizzate/locali.

    Non effettua scraping di siti pubblici protetti da CAPTCHA o anti-bot.
    """
    if csv_path:
        return asdict(lookup_from_csv(Path(csv_path), targa))
    return asdict(PlateLookupResult(
        status="not_configured",
        targa=normalize_plate(targa),
        source="manuale",
        dati={},
        message="Configura una fonte CSV o un provider API autorizzato",
    ))


def main() -> None:
    parser = argparse.ArgumentParser(description="Lookup targa da fonte convenzionale autorizzata")
    parser.add_argument("targa")
    parser.add_argument("--csv", dest="csv_path", help="Percorso CSV/Excel esportato in CSV")
    args = parser.parse_args()
    print(json.dumps(get_dati_targa(args.targa, args.csv_path), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
