"""fleet module

Revision ID: 007_fleet_module
Revises: 006_backfill_external_collaboration_type
Create Date: 2026-05-14 19:55:00
"""

from alembic import op
import sqlalchemy as sa


revision = "007_fleet_module"
down_revision = "006_backfill_external_collaboration_type"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vehicle_types",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("documentazione", sa.Text(), nullable=True),
        sa.Column("certificazioni", sa.Text(), nullable=True),
        sa.Column("patente", sa.String(length=255), nullable=True),
        sa.Column("revisione", sa.String(length=255), nullable=True),
        sa.Column("assicurazione", sa.String(length=255), nullable=True),
        sa.Column("tipo_abilitazione", sa.String(length=255), nullable=True),
        sa.Column("ente_controllo", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.UniqueConstraint("name", name="uq_vehicle_types_name"),
    )

    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_type_id", sa.Integer(), sa.ForeignKey("vehicle_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("targa", sa.String(length=255), nullable=False),
        sa.Column("marca", sa.String(length=255), nullable=False),
        sa.Column("modello", sa.String(length=255), nullable=False),
        sa.Column("tipo", sa.String(length=255), nullable=False),
        sa.Column("immatricolazione_date", sa.Date(), nullable=True),
        sa.Column("immatricolazione_mese", sa.Integer(), nullable=True),
        sa.Column("immatricolazione_anno", sa.Integer(), nullable=True),
        sa.Column("numero_telaio", sa.String(length=100), nullable=True),
        sa.Column("alimentazione", sa.String(length=50), nullable=True),
        sa.Column("euro_classe", sa.String(length=20), nullable=True),
        sa.Column("colore", sa.String(length=50), nullable=True),
        sa.Column("proprieta_tipo", sa.String(length=50), nullable=True),
        sa.Column("localizzazione_corrente", sa.String(length=255), nullable=True),
        sa.Column("assicurazione_compagnia", sa.String(length=255), nullable=True),
        sa.Column("assicurazione_polizza", sa.String(length=255), nullable=True),
        sa.Column("scadenza_assicurazione", sa.Date(), nullable=True),
        sa.Column("assicurazione_copertura", sa.Date(), nullable=True),
        sa.Column("scadenza_revisione", sa.Date(), nullable=True),
        sa.Column("ultima_revisione", sa.Date(), nullable=True),
        sa.Column("scadenza_verifica_sicurezza", sa.Date(), nullable=True),
        sa.Column("rottamazione_date", sa.Date(), nullable=True),
        sa.Column("km_attuali", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stato", sa.String(length=50), nullable=True, server_default="operativo"),
        sa.Column("tracker_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("last_longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("last_position_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.UniqueConstraint("targa", name="uq_vehicles_targa"),
    )
    op.create_index("ix_vehicles_targa", "vehicles", ["targa"])
    op.create_index("ix_vehicles_vehicle_type_id", "vehicles", ["vehicle_type_id"])
    op.create_index("ix_vehicles_organization_id", "vehicles", ["organization_id"])

    op.create_table(
        "vehicle_revisions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("data_revisione", sa.Date(), nullable=False),
        sa.Column("esito", sa.String(length=255), nullable=False, server_default="regolare"),
        sa.Column("km_rilevati", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_revisions_vehicle_id", "vehicle_revisions", ["vehicle_id"])

    op.create_table(
        "vehicle_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("km_iniziali", sa.Integer(), nullable=False),
        sa.Column("km_finali", sa.Integer(), nullable=True),
        sa.Column("assegnato_il", sa.DateTime(timezone=True), nullable=True),
        sa.Column("riconsegnato_il", sa.DateTime(timezone=True), nullable=True),
        sa.Column("documento_assegnazione_numero", sa.String(length=100), nullable=True),
        sa.Column("documento_assegnazione_data", sa.Date(), nullable=True),
        sa.Column("documento_assegnazione_path", sa.String(length=255), nullable=True),
        sa.Column("documento_restituzione_numero", sa.String(length=100), nullable=True),
        sa.Column("documento_restituzione_data", sa.Date(), nullable=True),
        sa.Column("documento_restituzione_path", sa.String(length=255), nullable=True),
        sa.Column("stato", sa.String(length=50), nullable=False, server_default="assegnato"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_logs_vehicle_id", "vehicle_logs", ["vehicle_id"])
    op.create_index("ix_vehicle_logs_user_id", "vehicle_logs", ["user_id"])
    op.create_index("ix_vehicle_logs_employee_id", "vehicle_logs", ["employee_id"])

    op.create_table(
        "vehicle_incidents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("data_evento", sa.Date(), nullable=False),
        sa.Column("data_chiusura", sa.Date(), nullable=True),
        sa.Column("stato", sa.String(length=50), nullable=False, server_default="aperto"),
        sa.Column("tipo", sa.String(length=100), nullable=True),
        sa.Column("luogo", sa.String(length=255), nullable=True),
        sa.Column("descrizione", sa.Text(), nullable=True),
        sa.Column("numero_sinistro", sa.String(length=100), nullable=True),
        sa.Column("importo_danno", sa.Numeric(12, 2), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_incidents_vehicle_id", "vehicle_incidents", ["vehicle_id"])

    op.create_table(
        "vehicle_documents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tipo_documento", sa.String(length=100), nullable=False),
        sa.Column("titolo", sa.String(length=255), nullable=True),
        sa.Column("numero_documento", sa.String(length=100), nullable=True),
        sa.Column("data_rilascio", sa.Date(), nullable=True),
        sa.Column("data_scadenza", sa.Date(), nullable=True),
        sa.Column("percorso_file", sa.String(length=255), nullable=True),
        sa.Column("stato", sa.String(length=50), nullable=False, server_default="attivo"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_documents_vehicle_id", "vehicle_documents", ["vehicle_id"])

    op.create_table(
        "aib_team_vehicles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("team_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_aib_team_vehicles_team_id", "aib_team_vehicles", ["team_id"])
    op.create_index("ix_aib_team_vehicles_vehicle_id", "aib_team_vehicles", ["vehicle_id"])


def downgrade() -> None:
    op.drop_index("ix_aib_team_vehicles_vehicle_id", table_name="aib_team_vehicles")
    op.drop_index("ix_aib_team_vehicles_team_id", table_name="aib_team_vehicles")
    op.drop_table("aib_team_vehicles")

    op.drop_index("ix_vehicle_documents_vehicle_id", table_name="vehicle_documents")
    op.drop_table("vehicle_documents")

    op.drop_index("ix_vehicle_incidents_vehicle_id", table_name="vehicle_incidents")
    op.drop_table("vehicle_incidents")

    op.drop_index("ix_vehicle_logs_employee_id", table_name="vehicle_logs")
    op.drop_index("ix_vehicle_logs_user_id", table_name="vehicle_logs")
    op.drop_index("ix_vehicle_logs_vehicle_id", table_name="vehicle_logs")
    op.drop_table("vehicle_logs")

    op.drop_index("ix_vehicle_revisions_vehicle_id", table_name="vehicle_revisions")
    op.drop_table("vehicle_revisions")

    op.drop_index("ix_vehicles_organization_id", table_name="vehicles")
    op.drop_index("ix_vehicles_vehicle_type_id", table_name="vehicles")
    op.drop_index("ix_vehicles_targa", table_name="vehicles")
    op.drop_table("vehicles")

    op.drop_table("vehicle_types")
