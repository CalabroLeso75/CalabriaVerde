#!/usr/bin/env python3
"""
Utility iniziale per aggiungere voci ai registri locali del progetto.

Uso indicativo:
    python execution/update_registers.py activity "Descrizione attività"
    python execution/update_registers.py error "Descrizione errore"
    python execution/update_registers.py decision "Descrizione decisione"

Questo script è volutamente semplice e può essere esteso in base al progetto reale.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTIVES = ROOT / "directives"

TARGETS = {
    "activity": DIRECTIVES / "activity_log.md",
    "error": DIRECTIVES / "error_memory.md",
    "decision": DIRECTIVES / "decisions.md",
    "objective": DIRECTIVES / "objectives.md",
}


def append_entry(kind: str, message: str) -> None:
    if kind not in TARGETS:
        valid = ", ".join(TARGETS)
        raise ValueError(f"Tipo registro non valido: {kind}. Valori ammessi: {valid}")

    target = TARGETS[kind]
    target.parent.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"\n\n## {timestamp} - Aggiornamento {kind}\n\n{message.strip()}\n"

    with target.open("a", encoding="utf-8") as file:
        file.write(entry)

    print(f"Aggiornato: {target}")


def main() -> int:
    if len(sys.argv) < 3:
        print("Uso: python execution/update_registers.py <activity|error|decision|objective> <messaggio>")
        return 1

    kind = sys.argv[1].strip().lower()
    message = " ".join(sys.argv[2:]).strip()

    if not message:
        print("Errore: messaggio vuoto.")
        return 1

    try:
        append_entry(kind, message)
    except Exception as exc:
        print(f"Errore: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
