"""
Migration: 001 — Schema iniziale Gestionale Calabria Verde
Crea tutte le tabelle core: organizations, users, employees e correlate.

Generata: 2026-05-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============================================
    # ORGANIZATIONS
    # ============================================
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(200), nullable=False),
        sa.Column('codice', sa.String(20), nullable=True),
        sa.Column('tipo', sa.Enum('ente', 'distretto', 'distaccamento', 'squadra', name='org_tipo'), nullable=False, server_default='ente'),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(150), nullable=True),
        sa.Column('telefono', sa.String(30), nullable=True),
        sa.Column('indirizzo', sa.String(300), nullable=True),
        sa.Column('comune', sa.String(100), nullable=True),
        sa.Column('provincia', sa.String(5), nullable=True),
        sa.Column('latitudine', sa.Numeric(10, 7), nullable=True),
        sa.Column('longitudine', sa.Numeric(10, 7), nullable=True),
        sa.Column('is_aib', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_attiva', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['organizations.id'], ondelete='SET NULL', name='fk_org_parent'),
        sa.PrimaryKeyConstraint('id'),
        comment='Struttura organizzativa Calabria Verde'
    )
    op.create_index('idx_org_tipo', 'organizations', ['tipo'])
    op.create_index('idx_org_parent', 'organizations', ['parent_id'])

    # ============================================
    # USERS
    # ============================================
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(150), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('codice_fiscale', sa.String(16), nullable=True),
        sa.Column('nome', sa.String(100), nullable=True),
        sa.Column('cognome', sa.String(100), nullable=True),
        sa.Column('telefono', sa.String(30), nullable=True),
        sa.Column('status', sa.Enum('pending', 'active', 'rejected', 'suspended', name='user_status'), nullable=False, server_default='pending'),
        sa.Column('tipo', sa.Enum('interno', 'esterno', 'sistema', name='user_tipo'), nullable=False, server_default='interno'),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('settore_interesse', sa.String(100), nullable=True),
        sa.Column('tipo_contratto_richiesto', sa.String(50), nullable=True),
        sa.Column('mansione_interesse', sa.String(200), nullable=True),
        sa.Column('note_registrazione', sa.Text(), nullable=True),
        sa.Column('note_approvazione', sa.Text(), nullable=True),
        sa.Column('approvato_da_user_id', sa.Integer(), nullable=True),
        sa.Column('approvato_il', sa.DateTime(timezone=True), nullable=True),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_ip', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL', name='fk_user_org'),
        sa.ForeignKeyConstraint(['approvato_da_user_id'], ['users.id'], ondelete='SET NULL', name='fk_user_approved_by'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_user_email'),
        sa.UniqueConstraint('codice_fiscale', name='uq_user_cf'),
        comment='Utenti di sistema Gestionale Calabria Verde'
    )
    op.create_index('idx_user_status', 'users', ['status'])
    op.create_index('idx_user_cf', 'users', ['codice_fiscale'])

    # ============================================
    # ROLES
    # ============================================
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('codice', sa.String(50), nullable=False),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('permessi', sa.JSON(), nullable=True),
        sa.Column('is_sistema', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codice', name='uq_role_codice'),
    )

    # ============================================
    # USER_ROLES (pivot)
    # ============================================
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('assigned_by_user_id', sa.Integer(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name='fk_ur_user'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE', name='fk_ur_role'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL', name='fk_ur_org'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_id', 'organization_id', name='uq_user_role_org'),
    )

    # ============================================
    # EMPLOYEES
    # ============================================
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('tipo', sa.Enum('interno', 'esterno', name='employee_tipo'), nullable=False),
        sa.Column('codice_fiscale', sa.String(16), nullable=False),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('cognome', sa.String(100), nullable=False),
        sa.Column('genere', sa.Enum('M', 'F', 'NB', name='employee_genere'), nullable=True),
        sa.Column('data_nascita', sa.Date(), nullable=True),
        sa.Column('luogo_nascita', sa.String(100), nullable=True),
        sa.Column('provincia_nascita', sa.String(5), nullable=True),
        sa.Column('luogo_nascita_estero', sa.String(200), nullable=True),

        sa.Column('email_istituzionale', sa.String(150), nullable=True),
        sa.Column('pec', sa.String(150), nullable=True),
        sa.Column('telefono_lavoro', sa.String(30), nullable=True),
        sa.Column('email_personale', sa.String(150), nullable=True),
        sa.Column('telefono_personale', sa.String(30), nullable=True),
        sa.Column('telefono_secondario', sa.String(30), nullable=True),

        sa.Column('tipo_contratto', sa.Enum('indeterminato', 'determinato', 'stagionale', 'somministrazione', 'collaborazione', 'volontario', name='contract_tipo'), nullable=True),
        sa.Column('data_assunzione', sa.Date(), nullable=True),
        sa.Column('data_fine_contratto', sa.Date(), nullable=True),
        sa.Column('numero_matricola', sa.String(20), nullable=True),
        sa.Column('mansione', sa.String(200), nullable=True),
        sa.Column('livello_inquadramento', sa.String(50), nullable=True),

        sa.Column('stato', sa.Enum('in_servizio', 'malattia', 'infortunio', 'aspettativa', 'maternita', 'distaccato', 'sospeso', 'cessato', 'pensionato', name='employee_stato'), nullable=False, server_default='in_servizio'),
        sa.Column('stato_quiescenza', sa.Enum('non_verificata', 'verificata', 'pensionato', 'pensionata', name='retirement_stato'), nullable=True, server_default='non_verificata'),

        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),

        # Flag operativi AIB
        sa.Column('is_aib_qualificato', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_dos', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_emergency_available', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_emergency_coordinator', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_operations_room_manager', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_operations_room_operator', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_mechanical_operator', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_aib_pc_operator', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_pc_operator', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_driver', sa.Boolean(), nullable=False, server_default='0'),

        sa.Column('patenti', sa.JSON(), nullable=True),
        sa.Column('abilitazioni', sa.JSON(), nullable=True),
        sa.Column('documenti_scadenza', sa.JSON(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),

        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='SET NULL', name='fk_emp_org'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL', name='fk_emp_user'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codice_fiscale', name='uq_emp_cf'),
        sa.UniqueConstraint('email_istituzionale', name='uq_emp_email'),
        sa.UniqueConstraint('numero_matricola', name='uq_emp_matricola'),
        sa.UniqueConstraint('user_id', name='uq_emp_user'),
        comment='Anagrafica evoluta dipendenti e collaboratori Calabria Verde'
    )
    op.create_index('idx_employee_cognome_nome', 'employees', ['cognome', 'nome'])
    op.create_index('idx_employee_tipo_stato', 'employees', ['tipo', 'stato'])
    op.create_index('idx_employee_org', 'employees', ['organization_id'])
    op.create_index('idx_employee_cf', 'employees', ['codice_fiscale'])

    # ============================================
    # EMPLOYEE QUALIFICATIONS
    # ============================================
    op.create_table(
        'employee_qualifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('tipo_qualifica', sa.String(100), nullable=False),
        sa.Column('is_attiva', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('data_conseguimento', sa.Date(), nullable=True),
        sa.Column('data_scadenza', sa.Date(), nullable=True),
        sa.Column('ente_rilascio', sa.String(200), nullable=True),
        sa.Column('numero_documento', sa.String(100), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('pc_emergency_event_id', sa.Integer(), nullable=True),
        sa.Column('enabled_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE', name='fk_qual_emp'),
        sa.ForeignKeyConstraint(['enabled_by_user_id'], ['users.id'], ondelete='SET NULL', name='fk_qual_user'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_qual_employee_tipo', 'employee_qualifications', ['employee_id', 'tipo_qualifica'])
    op.create_index('idx_qual_attiva', 'employee_qualifications', ['employee_id', 'is_attiva'])

    # ============================================
    # EMPLOYEE DOCUMENTS
    # ============================================
    op.create_table(
        'employee_documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(100), nullable=False),
        sa.Column('nome_file', sa.String(255), nullable=False),
        sa.Column('percorso_file', sa.String(500), nullable=False),
        sa.Column('dimensione_bytes', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('data_scadenza', sa.Date(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('uploaded_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE', name='fk_doc_emp'),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id'], ondelete='SET NULL', name='fk_doc_user'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_doc_employee', 'employee_documents', ['employee_id'])
    op.create_index('idx_doc_tipo', 'employee_documents', ['tipo'])

    # ============================================
    # EMPLOYEE OPERATIONAL ROLES
    # ============================================
    op.create_table(
        'employee_operational_roles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('nome_ruolo', sa.String(200), nullable=False),
        sa.Column('tipo_ruolo', sa.String(100), nullable=True),
        sa.Column('data_inizio', sa.Date(), nullable=True),
        sa.Column('data_fine', sa.Date(), nullable=True),
        sa.Column('is_attivo', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('assigned_by_user_id', sa.Integer(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE', name='fk_opr_emp'),
        sa.ForeignKeyConstraint(['assigned_by_user_id'], ['users.id'], ondelete='SET NULL', name='fk_opr_user'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_role_employee_attivo', 'employee_operational_roles', ['employee_id', 'is_attivo'])

    # ============================================
    # SEED RUOLI DI SISTEMA
    # ============================================
    op.execute("""
        INSERT INTO roles (codice, nome, descrizione, is_sistema) VALUES
        ('superadmin', 'Super Amministratore', 'Accesso completo a tutto il sistema', 1),
        ('admin', 'Amministratore', 'Gestione utenti e configurazioni', 1),
        ('responsabile_distretto', 'Responsabile di Distretto', 'Gestione distretto di competenza', 0),
        ('dos', 'DOS - Direttore Operazioni Spegnimento', 'Direzione operazioni antincendio boschivo', 0),
        ('capo_squadra', 'Capo Squadra AIB', 'Coordinamento squadra AIB sul campo', 0),
        ('operatore_aib', 'Operatore AIB', 'Operatività sul campo antincendio', 0),
        ('direttore_lavori', 'Direttore dei Lavori', 'Supervisione cantieri forestali', 0),
        ('operatore_cantiere', 'Operatore di Cantiere', 'Attività di cantiere forestale', 0),
        ('operatore_magazzino', 'Operatore Magazzino', 'Gestione scorte e movimentazioni', 0),
        ('addetto_flotta', 'Addetto Parco Macchine', 'Gestione veicoli e attrezzature', 0),
        ('addetto_hr', 'Addetto Risorse Umane', 'Gestione anagrafica e fascicoli personale', 0),
        ('operatore_sala', 'Operatore Sala Operativa', 'Monitoraggio sale operative e wall monitor', 0)
    """)


def downgrade() -> None:
    op.drop_table('employee_operational_roles')
    op.drop_table('employee_documents')
    op.drop_table('employee_qualifications')
    op.drop_table('employees')
    op.drop_table('user_roles')
    op.drop_table('roles')
    op.drop_table('users')
    op.drop_table('organizations')
