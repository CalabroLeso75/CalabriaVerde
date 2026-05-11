"""Migration 001 - schema iniziale Gestionale Calabria Verde."""

from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "type",
            sa.Enum("sede_centrale", "distretto", "distaccamento", "postazione", "cantiere", name="org_type"),
            nullable=False,
        ),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("address", sa.String(300), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("province", sa.String(2), nullable=True),
        sa.Column("cap", sa.String(5), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("pec", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_temporary", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        comment="Struttura organizzativa Calabria Verde",
    )
    op.create_index(op.f("ix_organizations_code"), "organizations", ["code"])
    op.create_index(op.f("ix_organizations_type"), "organizations", ["type"])

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("codice_fiscale", sa.String(16), nullable=False),
        sa.Column("status", sa.Enum("pending", "attivo", "sospeso", "disattivato", name="user_status"), nullable=False),
        sa.Column("nome", sa.String(100), nullable=False),
        sa.Column("cognome", sa.String(100), nullable=False),
        sa.Column("telefono", sa.String(20), nullable=True),
        sa.Column("approved_by", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_superadmin", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codice_fiscale"),
        sa.UniqueConstraint("email"),
        comment="Utenti di sistema Gestionale Calabria Verde",
    )
    op.create_index(op.f("ix_users_codice_fiscale"), "users", ["codice_fiscale"])
    op.create_index(op.f("ix_users_email"), "users", ["email"])
    op.create_index(op.f("ix_users_status"), "users", ["status"])

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("module_scope", sa.String(50), nullable=True),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("assigned_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_roles_user_id"), "user_roles", ["user_id"])

    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tipo", sa.Enum("interno", "esterno", name="employeetype"), nullable=False),
        sa.Column("codice_fiscale", sa.String(16), nullable=False),
        sa.Column("nome", sa.String(100), nullable=False),
        sa.Column("cognome", sa.String(100), nullable=False),
        sa.Column("genere", sa.Enum("M", "F", "NB", name="gender"), nullable=True),
        sa.Column("data_nascita", sa.Date(), nullable=True),
        sa.Column("luogo_nascita", sa.String(100), nullable=True),
        sa.Column("provincia_nascita", sa.String(5), nullable=True),
        sa.Column("luogo_nascita_estero", sa.String(200), nullable=True),
        sa.Column("email_istituzionale", sa.String(150), nullable=True),
        sa.Column("pec", sa.String(150), nullable=True),
        sa.Column("telefono_lavoro", sa.String(30), nullable=True),
        sa.Column("email_personale", sa.String(150), nullable=True),
        sa.Column("telefono_personale", sa.String(30), nullable=True),
        sa.Column("telefono_secondario", sa.String(30), nullable=True),
        sa.Column(
            "tipo_contratto",
            sa.Enum("indeterminato", "determinato", "stagionale", "somministrazione", "collaborazione", "volontario", name="contracttype"),
            nullable=True,
        ),
        sa.Column("data_assunzione", sa.Date(), nullable=True),
        sa.Column("data_fine_contratto", sa.Date(), nullable=True),
        sa.Column("numero_matricola", sa.String(20), nullable=True),
        sa.Column("mansione", sa.String(200), nullable=True),
        sa.Column("livello_inquadramento", sa.String(50), nullable=True),
        sa.Column(
            "stato",
            sa.Enum("in_servizio", "malattia", "infortunio", "aspettativa", "maternita", "distaccato", "sospeso", "cessato", "pensionato", name="employeestatus"),
            nullable=False,
        ),
        sa.Column("stato_quiescenza", sa.Enum("non_verificata", "verificata", "pensionato", "pensionata", name="retirementstatus"), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("is_aib_qualificato", sa.Boolean(), nullable=False),
        sa.Column("is_dos", sa.Boolean(), nullable=False),
        sa.Column("is_emergency_available", sa.Boolean(), nullable=False),
        sa.Column("is_emergency_coordinator", sa.Boolean(), nullable=False),
        sa.Column("is_operations_room_manager", sa.Boolean(), nullable=False),
        sa.Column("is_operations_room_operator", sa.Boolean(), nullable=False),
        sa.Column("is_mechanical_operator", sa.Boolean(), nullable=False),
        sa.Column("is_aib_pc_operator", sa.Boolean(), nullable=False),
        sa.Column("is_pc_operator", sa.Boolean(), nullable=False),
        sa.Column("is_driver", sa.Boolean(), nullable=False),
        sa.Column("patenti", sa.JSON(), nullable=True),
        sa.Column("abilitazioni", sa.JSON(), nullable=True),
        sa.Column("documenti_scadenza", sa.JSON(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codice_fiscale"),
        sa.UniqueConstraint("email_istituzionale"),
        sa.UniqueConstraint("numero_matricola"),
        sa.UniqueConstraint("user_id"),
        comment="Anagrafica evoluta dipendenti e collaboratori Calabria Verde",
    )
    op.create_index("idx_employee_cognome_nome", "employees", ["cognome", "nome"])
    op.create_index("idx_employee_org", "employees", ["organization_id"])
    op.create_index("idx_employee_tipo_stato", "employees", ["tipo", "stato"])
    op.create_index(op.f("ix_employees_codice_fiscale"), "employees", ["codice_fiscale"])
    op.create_index(op.f("ix_employees_email_istituzionale"), "employees", ["email_istituzionale"])
    op.create_index(op.f("ix_employees_organization_id"), "employees", ["organization_id"])

    op.create_table(
        "employee_qualifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("tipo_qualifica", sa.String(100), nullable=False),
        sa.Column("is_attiva", sa.Boolean(), nullable=False),
        sa.Column("data_conseguimento", sa.Date(), nullable=True),
        sa.Column("data_scadenza", sa.Date(), nullable=True),
        sa.Column("ente_rilascio", sa.String(200), nullable=True),
        sa.Column("numero_documento", sa.String(100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("pc_emergency_event_id", sa.Integer(), nullable=True),
        sa.Column("enabled_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["enabled_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_qual_attiva", "employee_qualifications", ["employee_id", "is_attiva"])
    op.create_index("idx_qual_employee_tipo", "employee_qualifications", ["employee_id", "tipo_qualifica"])
    op.create_index(op.f("ix_employee_qualifications_employee_id"), "employee_qualifications", ["employee_id"])

    op.create_table(
        "employee_documents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(100), nullable=False),
        sa.Column("nome_file", sa.String(255), nullable=False),
        sa.Column("percorso_file", sa.String(500), nullable=False),
        sa.Column("dimensione_bytes", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("data_scadenza", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("uploaded_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_doc_tipo", "employee_documents", ["tipo"])
    op.create_index(op.f("ix_employee_documents_employee_id"), "employee_documents", ["employee_id"])

    op.create_table(
        "employee_operational_roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("nome_ruolo", sa.String(200), nullable=False),
        sa.Column("tipo_ruolo", sa.String(100), nullable=True),
        sa.Column("data_inizio", sa.Date(), nullable=True),
        sa.Column("data_fine", sa.Date(), nullable=True),
        sa.Column("is_attivo", sa.Boolean(), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_role_employee_attivo", "employee_operational_roles", ["employee_id", "is_attivo"])
    op.create_index(op.f("ix_employee_operational_roles_employee_id"), "employee_operational_roles", ["employee_id"])

    op.execute(
        """
        INSERT INTO roles (code, name, description, level) VALUES
        ('superadmin', 'Super Amministratore', 'Accesso completo a tutto il sistema', 100),
        ('admin', 'Amministratore', 'Gestione utenti e configurazioni', 90),
        ('responsabile_distretto', 'Responsabile di Distretto', 'Gestione distretto di competenza', 70),
        ('dos', 'DOS - Direttore Operazioni Spegnimento', 'Direzione operazioni antincendio boschivo', 60),
        ('capo_squadra', 'Capo Squadra AIB', 'Coordinamento squadra AIB sul campo', 50),
        ('operatore_aib', 'Operatore AIB', 'Operativita sul campo antincendio', 20),
        ('direttore_lavori', 'Direttore dei Lavori', 'Supervisione cantieri forestali', 60),
        ('operatore_cantiere', 'Operatore di Cantiere', 'Attivita di cantiere forestale', 20),
        ('operatore_magazzino', 'Operatore Magazzino', 'Gestione scorte e movimentazioni', 30),
        ('addetto_flotta', 'Addetto Parco Macchine', 'Gestione veicoli e attrezzature', 30),
        ('addetto_hr', 'Addetto Risorse Umane', 'Gestione anagrafica e fascicoli personale', 50),
        ('operatore_sala', 'Operatore Sala Operativa', 'Monitoraggio sale operative e wall monitor', 30)
        """
    )


def downgrade() -> None:
    op.drop_table("employee_operational_roles")
    op.drop_table("employee_documents")
    op.drop_table("employee_qualifications")
    op.drop_table("employees")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_table("users")
    op.drop_table("organizations")
