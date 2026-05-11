"""Migration 003 - anagrafica tipi di contratto e allegati."""

from alembic import op
import sqlalchemy as sa


revision = "003_admin_contract_types"
down_revision = "002_employee_contract_profiles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contract_type_definitions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("weekly_hours", sa.Integer(), nullable=True),
        sa.Column("supports_integrative", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("allows_partial_application", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(op.f("ix_contract_type_definitions_code"), "contract_type_definitions", ["code"])

    op.create_table(
        "contract_type_attachments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("contract_type_id", sa.Integer(), nullable=False),
        sa.Column("document_kind", sa.String(length=30), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["contract_type_id"], ["contract_type_definitions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contract_type_attachments_contract_type_id"), "contract_type_attachments", ["contract_type_id"])


def downgrade() -> None:
    op.drop_table("contract_type_attachments")
    op.drop_table("contract_type_definitions")
