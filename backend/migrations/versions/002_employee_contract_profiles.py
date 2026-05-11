"""Migration 002 - estensione profilo contrattuale dipendenti."""

from alembic import op
import sqlalchemy as sa


revision = "002_employee_contract_profiles"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("ccnl_code", sa.String(length=50), nullable=True))
    op.add_column("employees", sa.Column("ccnl_comparto", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("macro_inquadramento", sa.String(length=50), nullable=True))
    op.add_column("employees", sa.Column("profilo_professionale", sa.String(length=150), nullable=True))
    op.add_column("employees", sa.Column("categoria_inquadramento", sa.String(length=50), nullable=True))
    op.add_column("employees", sa.Column("posizione_economica", sa.String(length=20), nullable=True))
    op.add_column("employees", sa.Column("orario_settimanale", sa.Integer(), nullable=True))
    op.add_column("employees", sa.Column("regime_orario", sa.String(length=50), nullable=True))
    op.add_column("employees", sa.Column("scatti_anzianita", sa.Integer(), nullable=True))
    op.add_column("employees", sa.Column("data_prossimo_scatto", sa.Date(), nullable=True))
    op.add_column(
        "employees",
        sa.Column("integrativo_regionale", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column("employees", sa.Column("integrativo_regionale_note", sa.Text(), nullable=True))
    op.add_column(
        "employees",
        sa.Column("applicazione_parziale_contratto", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column("employees", sa.Column("applicazione_parziale_note", sa.Text(), nullable=True))
    op.add_column("employees", sa.Column("provenienza_assorbimento", sa.String(length=50), nullable=True))
    op.add_column("employees", sa.Column("ente_provenienza", sa.String(length=150), nullable=True))
    op.alter_column("employees", "integrativo_regionale", server_default=None)
    op.alter_column("employees", "applicazione_parziale_contratto", server_default=None)


def downgrade() -> None:
    op.drop_column("employees", "ente_provenienza")
    op.drop_column("employees", "provenienza_assorbimento")
    op.drop_column("employees", "integrativo_regionale_note")
    op.drop_column("employees", "integrativo_regionale")
    op.drop_column("employees", "applicazione_parziale_note")
    op.drop_column("employees", "applicazione_parziale_contratto")
    op.drop_column("employees", "data_prossimo_scatto")
    op.drop_column("employees", "scatti_anzianita")
    op.drop_column("employees", "regime_orario")
    op.drop_column("employees", "orario_settimanale")
    op.drop_column("employees", "posizione_economica")
    op.drop_column("employees", "categoria_inquadramento")
    op.drop_column("employees", "profilo_professionale")
    op.drop_column("employees", "macro_inquadramento")
    op.drop_column("employees", "ccnl_comparto")
    op.drop_column("employees", "ccnl_code")
