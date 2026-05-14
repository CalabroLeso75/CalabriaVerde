"""backfill external collaboration type

Revision ID: 006_backfill_external_collaboration_type
Revises: 005_external_collaboration_profiles
Create Date: 2026-05-14 18:00:00
"""
from alembic import op


revision = "006_backfill_external_collaboration_type"
down_revision = "005_external_collaboration_profiles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE employees
        SET tipo_collaborazione = 'collaborazione_generica'
        WHERE tipo = 'esterno'
          AND (tipo_collaborazione IS NULL OR tipo_collaborazione = '')
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE employees
        SET tipo_collaborazione = NULL
        WHERE tipo = 'esterno'
          AND tipo_collaborazione = 'collaborazione_generica'
        """
    )
