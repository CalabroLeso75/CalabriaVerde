"""fleet operations and communications

Revision ID: 008_fleet_ops_comms
Revises: 007_fleet_module
Create Date: 2026-05-14 23:20:00
"""

from alembic import op
import sqlalchemy as sa


revision = "008_fleet_ops_comms"
down_revision = "007_fleet_module"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fleet_groups",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("scope", sa.String(length=50), nullable=False, server_default="operativo"),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("province_code", sa.String(length=10), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.UniqueConstraint("name", name="uq_fleet_groups_name"),
        sa.UniqueConstraint("code", name="uq_fleet_groups_code"),
    )
    op.create_index("ix_fleet_groups_code", "fleet_groups", ["code"])

    op.create_table(
        "fleet_group_members",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("fleet_groups.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.UniqueConstraint("group_id", "vehicle_id", name="uq_fleet_group_vehicle"),
    )
    op.create_index("ix_fleet_group_members_group_id", "fleet_group_members", ["group_id"])
    op.create_index("ix_fleet_group_members_vehicle_id", "fleet_group_members", ["vehicle_id"])

    op.create_table(
        "vehicle_insurance_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("group_id", sa.Integer(), sa.ForeignKey("fleet_groups.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_type", sa.String(length=30), nullable=False, server_default="manuale"),
        sa.Column("compagnia", sa.String(length=255), nullable=False),
        sa.Column("broker", sa.String(length=255), nullable=True),
        sa.Column("package_name", sa.String(length=255), nullable=True),
        sa.Column("numero_polizza", sa.String(length=100), nullable=True),
        sa.Column("copertura_dal", sa.Date(), nullable=True),
        sa.Column("copertura_al", sa.Date(), nullable=True),
        sa.Column("data_scadenza", sa.Date(), nullable=False),
        sa.Column("channels_ready", sa.JSON(), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_insurance_records_vehicle_id", "vehicle_insurance_records", ["vehicle_id"])
    op.create_index("ix_vehicle_insurance_records_group_id", "vehicle_insurance_records", ["group_id"])

    op.create_table(
        "vehicle_usage_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("vehicle_logs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("km_partenza", sa.Integer(), nullable=False),
        sa.Column("km_rientro", sa.Integer(), nullable=True),
        sa.Column("note_presa", sa.Text(), nullable=True),
        sa.Column("note_rientro", sa.Text(), nullable=True),
        sa.Column("issue_flags", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_usage_logs_vehicle_id", "vehicle_usage_logs", ["vehicle_id"])
    op.create_index("ix_vehicle_usage_logs_assignment_id", "vehicle_usage_logs", ["assignment_id"])
    op.create_index("ix_vehicle_usage_logs_user_id", "vehicle_usage_logs", ["user_id"])
    op.create_index("ix_vehicle_usage_logs_employee_id", "vehicle_usage_logs", ["employee_id"])

    op.create_table(
        "vehicle_alerts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assignment_id", sa.Integer(), sa.ForeignKey("vehicle_logs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("alert_type", sa.String(length=50), nullable=False, server_default="segnalazione"),
        sa.Column("severity", sa.String(length=50), nullable=False, server_default="media"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="aperto"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location_text", sa.String(length=255), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("province_code", sa.String(length=10), nullable=True),
        sa.Column("event_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_vehicle_alerts_vehicle_id", "vehicle_alerts", ["vehicle_id"])
    op.create_index("ix_vehicle_alerts_assignment_id", "vehicle_alerts", ["assignment_id"])
    op.create_index("ix_vehicle_alerts_user_id", "vehicle_alerts", ["user_id"])
    op.create_index("ix_vehicle_alerts_employee_id", "vehicle_alerts", ["employee_id"])

    op.create_table(
        "communication_targets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_scope", sa.String(length=50), nullable=False, server_default="global"),
        sa.Column("compartment_scope", sa.String(length=100), nullable=True),
        sa.Column("role_label", sa.String(length=100), nullable=False),
        sa.Column("province_code", sa.String(length=10), nullable=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("display_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("whatsapp", sa.String(length=50), nullable=True),
        sa.Column("preferred_channels", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_communication_targets_module_scope", "communication_targets", ["module_scope"])
    op.create_index("ix_communication_targets_province_code", "communication_targets", ["province_code"])

    op.create_table(
        "communication_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_scope", sa.String(length=50), nullable=False, server_default="global"),
        sa.Column("compartment_scope", sa.String(length=100), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("channel", sa.String(length=50), nullable=False, server_default="sistema"),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("related_table", sa.String(length=100), nullable=True),
        sa.Column("related_id", sa.Integer(), nullable=True),
        sa.Column("sender_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("sender_employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="registrata"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_communication_logs_module_scope", "communication_logs", ["module_scope"])
    op.create_index("ix_communication_logs_related_id", "communication_logs", ["related_id"])

    op.create_table(
        "communication_recipients",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("communication_log_id", sa.Integer(), sa.ForeignKey("communication_logs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", sa.Integer(), sa.ForeignKey("communication_targets.id", ondelete="SET NULL"), nullable=True),
        sa.Column("recipient_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("recipient_employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="SET NULL"), nullable=True),
        sa.Column("recipient_label", sa.String(length=150), nullable=False),
        sa.Column("channel", sa.String(length=50), nullable=False, server_default="sistema"),
        sa.Column("destination", sa.String(length=255), nullable=True),
        sa.Column("delivery_status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
    )
    op.create_index("ix_communication_recipients_communication_log_id", "communication_recipients", ["communication_log_id"])
    op.create_index("ix_communication_recipients_target_id", "communication_recipients", ["target_id"])

    op.execute(
        """
        INSERT INTO fleet_groups (name, code, description, scope, is_active)
        SELECT 'Mezzi AIB', 'AIB', 'Gruppo operativo mezzi antincendio boschivo', 'aib', 1
        WHERE NOT EXISTS (SELECT 1 FROM fleet_groups WHERE code = 'AIB')
        """
    )
    op.execute(
        """
        INSERT IGNORE INTO fleet_group_members (group_id, vehicle_id)
        SELECT fg.id, atv.vehicle_id
        FROM fleet_groups fg
        JOIN aib_team_vehicles atv ON 1=1
        WHERE fg.code = 'AIB'
        """
    )


def downgrade() -> None:
    op.drop_index("ix_communication_recipients_target_id", table_name="communication_recipients")
    op.drop_index("ix_communication_recipients_communication_log_id", table_name="communication_recipients")
    op.drop_table("communication_recipients")

    op.drop_index("ix_communication_logs_related_id", table_name="communication_logs")
    op.drop_index("ix_communication_logs_module_scope", table_name="communication_logs")
    op.drop_table("communication_logs")

    op.drop_index("ix_communication_targets_province_code", table_name="communication_targets")
    op.drop_index("ix_communication_targets_module_scope", table_name="communication_targets")
    op.drop_table("communication_targets")

    op.drop_index("ix_vehicle_alerts_employee_id", table_name="vehicle_alerts")
    op.drop_index("ix_vehicle_alerts_user_id", table_name="vehicle_alerts")
    op.drop_index("ix_vehicle_alerts_assignment_id", table_name="vehicle_alerts")
    op.drop_index("ix_vehicle_alerts_vehicle_id", table_name="vehicle_alerts")
    op.drop_table("vehicle_alerts")

    op.drop_index("ix_vehicle_usage_logs_employee_id", table_name="vehicle_usage_logs")
    op.drop_index("ix_vehicle_usage_logs_user_id", table_name="vehicle_usage_logs")
    op.drop_index("ix_vehicle_usage_logs_assignment_id", table_name="vehicle_usage_logs")
    op.drop_index("ix_vehicle_usage_logs_vehicle_id", table_name="vehicle_usage_logs")
    op.drop_table("vehicle_usage_logs")

    op.drop_index("ix_vehicle_insurance_records_group_id", table_name="vehicle_insurance_records")
    op.drop_index("ix_vehicle_insurance_records_vehicle_id", table_name="vehicle_insurance_records")
    op.drop_table("vehicle_insurance_records")

    op.drop_index("ix_fleet_group_members_vehicle_id", table_name="fleet_group_members")
    op.drop_index("ix_fleet_group_members_group_id", table_name="fleet_group_members")
    op.drop_table("fleet_group_members")

    op.drop_index("ix_fleet_groups_code", table_name="fleet_groups")
    op.drop_table("fleet_groups")
