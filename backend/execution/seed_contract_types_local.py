"""
Seed deterministico dei tipi di contratto base per il collaudo locale.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.contract_type import ContractTypeDefinition


@dataclass(frozen=True)
class ContractSeed:
    code: str
    name: str
    category: str
    description: str
    weekly_hours: int
    supports_integrative: bool
    allows_partial_application: bool
    is_active: bool
    notes: str


SEEDS: tuple[ContractSeed, ...] = (
    ContractSeed(
        code="idraulico_forestale",
        name="CCNL idraulico-forestale e idraulico-agraria",
        category="comparto idraulico-forestale e agrario",
        description=(
            "Contratto prevalente per operai e impiegati forestali con gestione livelli, "
            "orario standard e integrativo regionale."
        ),
        weekly_hours=39,
        supports_integrative=True,
        allows_partial_application=False,
        is_active=True,
        notes=(
            "Prevedere livelli operai e impiegati, gestione anzianita e "
            "contrattazione integrativa regionale Calabria."
        ),
    ),
    ContractSeed(
        code="funzioni_locali",
        name="CCNL Funzioni Locali",
        category="comparto funzioni locali",
        description=(
            "Per personale proveniente da Comunita montane, LSU, LPU, Fondo Sollievo "
            "ed eventuali altri bacini assorbiti nell'ente."
        ),
        weekly_hours=36,
        supports_integrative=True,
        allows_partial_application=True,
        is_active=True,
        notes=(
            "Distinguere provenienza ex Comunita montana, ex LSU, ex LPU, ex Fondo Sollievo "
            "ed eventuale applicazione solo parziale del contratto."
        ),
    ),
)


def upsert_contracts(db: Session) -> tuple[int, int]:
    created = 0
    updated = 0

    for seed in SEEDS:
        existing = (
            db.query(ContractTypeDefinition)
            .filter(ContractTypeDefinition.code == seed.code)
            .first()
        )

        payload = {
            "name": seed.name,
            "category": seed.category,
            "description": seed.description,
            "weekly_hours": seed.weekly_hours,
            "supports_integrative": seed.supports_integrative,
            "allows_partial_application": seed.allows_partial_application,
            "is_active": seed.is_active,
            "notes": seed.notes,
        }

        if existing:
            for field, value in payload.items():
                setattr(existing, field, value)
            updated += 1
            continue

        db.add(
            ContractTypeDefinition(
                code=seed.code,
                **payload,
            )
        )
        created += 1

    db.commit()
    return created, updated


def main() -> None:
    db = SessionLocal()
    try:
        created, updated = upsert_contracts(db)
        total = db.query(ContractTypeDefinition).count()
        print(f"Creati: {created}")
        print(f"Aggiornati: {updated}")
        print(f"Totale contratti: {total}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
