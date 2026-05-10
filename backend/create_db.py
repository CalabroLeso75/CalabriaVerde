# -*- coding: utf-8 -*-
"""
Script importazione anagrafica dal DB legacy XAMPP (azienda_local)
al nuovo schema Gestionale Calabria Verde.
"""
import io
import sys
import logging
import pymysql

# Fix encoding Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
log = logging.getLogger(__name__)

# ============================================
# CONNESSIONI
# ============================================
src = pymysql.connect(
    host='localhost', port=3306, user='root', password='',
    database='azienda_local', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor,
)
dst = pymysql.connect(
    host='localhost', port=3306, user='root', password='',
    database='gestionale_cv', charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor,
)
DRY_RUN = False

# Verifica colonne reali di it_municipalities
src_cursor = src.cursor()
src_cursor.execute("DESCRIBE it_municipalities")
mun_cols = {row['Field'] for row in src_cursor.fetchall()}
src_cursor.execute("DESCRIBE it_provinces")
prov_cols = {row['Field'] for row in src_cursor.fetchall()}
log.info(f"Colonne it_municipalities: {mun_cols}")
log.info(f"Colonne it_provinces: {prov_cols}")

# Determina i nomi delle colonne name/nome
mun_name_col = 'name' if 'name' in mun_cols else ('nome' if 'nome' in mun_cols else 'denominazione')
prov_name_col = 'name' if 'name' in prov_cols else ('nome' if 'nome' in prov_cols else 'denominazione')
prov_sigla_col = 'sigla' if 'sigla' in prov_cols else ('short_code' if 'short_code' in prov_cols else ('abbreviation' if 'abbreviation' in prov_cols else 'code'))
log.info(f"Usando: mun.{mun_name_col}, prov.{prov_name_col}, prov.{prov_sigla_col}")

# ============================================
# MAPPING
# ============================================
STATO_MAP = {
    'operativo':  'in_servizio',
    'cessato':    'cessato',
    'sospeso':    'sospeso',
    'in_attesa':  'in_servizio',
}
TIPO_CONTRATTO_MAP_KEYS = [
    ('INDET', 'indeterminato'), ('T-IN', 'indeterminato'),
    ('STAG', 'stagionale'), ('DET', 'determinato'),
    ('SOMM', 'somministrazione'), ('COLLAB', 'collaborazione'), ('VOLONT', 'volontario'),
]
PATENTE_MAP = {
    'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'CQC': 'CQC',
    'patentino_mezzi': 'patentino_mezzi_agricoli', 'PLE': 'PLE',
    'gru': 'gru', 'carrelli': 'carrelli_elevatori',
    'sollevatori': 'piattaforme_elevabili', 'perforatrici': 'perforatrici',
    'altro': 'altro',
}

# ============================================
# STEP 1: ORGANIZZAZIONI
# ============================================
log.info("=" * 60)
log.info("STEP 1: Organizzazioni")
src_cursor.execute("SELECT id, nome, tipo, codice_esterno FROM anag_organizzazioni")
orgs = src_cursor.fetchall()
org_id_map = {}
dst_cursor = dst.cursor()

for org in orgs:
    if not DRY_RUN:
        dst_cursor.execute("""
            INSERT INTO organizations (nome, codice, tipo, is_aib, is_attiva, created_at, updated_at)
            VALUES (%s, %s, 'ente', 1, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE nome=VALUES(nome)
        """, (org['nome'], org.get('codice_esterno') or None))
        dst.commit()
        dst_cursor.execute("SELECT id FROM organizations WHERE nome=%s LIMIT 1", (org['nome'],))
        row = dst_cursor.fetchone()
        new_id = row['id'] if row else 1
        org_id_map[org['id']] = new_id
        log.info(f"  Org: {org['nome']} -> id={new_id}")
    else:
        org_id_map[org['id']] = org['id']

dst_cursor.execute("SELECT id FROM organizations LIMIT 1")
cv_org_row = dst_cursor.fetchone()
cv_org_id = cv_org_row['id'] if cv_org_row else 1

# ============================================
# STEP 2: CONTRATTI LOOKUP
# ============================================
src_cursor.execute("SELECT id, codice FROM anag_contratti")
contratti = {c['id']: c['codice'].upper() for c in src_cursor.fetchall()}

def get_tipo_contratto(cid):
    if not cid or cid not in contratti:
        return 'determinato'
    codice = contratti[cid]
    for key, val in TIPO_CONTRATTO_MAP_KEYS:
        if key in codice:
            return val
    return 'determinato'

# ============================================
# STEP 3: PERSONE
# ============================================
log.info("=" * 60)
log.info("STEP 2: Dipendenti (anag_persone -> employees)")

src_cursor.execute(f"""
    SELECT
        ap.id, ap.nome, ap.cognome, ap.codice_fiscale, ap.data_nascita,
        ap.luogo_nascita_testo, ap.genere, ap.matricola,
        ap.tipo_personale, ap.stato_rapporto,
        ap.email_aziendale, ap.email_personale,
        ap.telefono_aziendale, ap.telefono_personale,
        ap.note, ap.contratto_id, ap.ccnl_posizione,
        ap.organizzazione_id, ap.organizzazione_esterna_id,
        mun.{mun_name_col} AS luogo_nascita_nome,
        prov.{prov_sigla_col} AS provincia_sigla
    FROM anag_persone ap
    LEFT JOIN it_municipalities mun ON mun.id = ap.luogo_nascita_id
    LEFT JOIN it_provinces prov ON prov.id = ap.luogo_nascita_provincia_id
    ORDER BY ap.cognome, ap.nome
""")
persone = src_cursor.fetchall()
log.info(f"  Trovate: {len(persone)} persone")

stats = {'importati': 0, 'aggiornati': 0, 'saltati': 0, 'errori': 0}
cf_set = set()

for p in persone:
    try:
        cf = (p.get('codice_fiscale') or '').strip().upper()
        if not cf:
            stats['saltati'] += 1
            continue

        tipo = 'interno' if p.get('tipo_personale') == 'interno' else 'esterno'
        stato = STATO_MAP.get((p.get('stato_rapporto') or 'operativo').lower(), 'in_servizio')
        genere_src = (p.get('genere') or '').lower()
        genere = 'M' if genere_src == 'uomo' else ('F' if genere_src == 'donna' else None)
        tipo_contratto = get_tipo_contratto(p.get('contratto_id'))
        org_id = cv_org_id if tipo == 'interno' else org_id_map.get(p.get('organizzazione_esterna_id'))
        luogo = (p.get('luogo_nascita_nome') or p.get('luogo_nascita_testo') or '').strip()[:100] or None
        provincia = (p.get('provincia_sigla') or '')[:5] or None
        email_ist = (p.get('email_aziendale') or '').strip().lower()[:150] or None
        email_pers = (p.get('email_personale') or '').strip().lower()[:150] or None
        tel_lav = (p.get('telefono_aziendale') or '').strip()[:30] or None
        tel_pers = (p.get('telefono_personale') or '').strip()[:30] or None
        mansione = p.get('ccnl_posizione')
        matricola = (p.get('matricola') or '').strip()[:20] or None
        note = (p.get('note') or '').strip()[:1000] or None

        if not DRY_RUN:
            dst_cursor.execute("SELECT id FROM employees WHERE codice_fiscale=%s", (cf,))
            existing = dst_cursor.fetchone()
            if existing:
                dst_cursor.execute("""
                    UPDATE employees SET tipo=%s, nome=%s, cognome=%s, genere=%s,
                    data_nascita=%s, luogo_nascita=%s, provincia_nascita=%s,
                    email_istituzionale=%s, email_personale=%s,
                    telefono_lavoro=%s, telefono_personale=%s,
                    tipo_contratto=%s, numero_matricola=%s, mansione=%s,
                    stato=%s, organization_id=%s, note=%s, updated_at=NOW()
                    WHERE codice_fiscale=%s
                """, (tipo, p['nome'].strip().title(), p['cognome'].strip().title(), genere,
                      p.get('data_nascita'), luogo, provincia, email_ist, email_pers,
                      tel_lav, tel_pers, tipo_contratto, matricola, mansione,
                      stato, org_id, note, cf))
                dst.commit()
                stats['aggiornati'] += 1
            else:
                dst_cursor.execute("""
                    INSERT INTO employees (tipo, codice_fiscale, nome, cognome, genere,
                    data_nascita, luogo_nascita, provincia_nascita,
                    email_istituzionale, email_personale, telefono_lavoro, telefono_personale,
                    tipo_contratto, numero_matricola, mansione, stato, organization_id, note,
                    created_at, updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                """, (tipo, cf, p['nome'].strip().title(), p['cognome'].strip().title(), genere,
                      p.get('data_nascita'), luogo, provincia, email_ist, email_pers,
                      tel_lav, tel_pers, tipo_contratto, matricola, mansione,
                      stato, org_id, note))
                dst.commit()
                stats['importati'] += 1
            cf_set.add(cf)
            if (stats['importati'] + stats['aggiornati']) % 500 == 0:
                log.info(f"  ... {stats['importati']+stats['aggiornati']} processati")
        else:
            stats['importati'] += 1
            cf_set.add(cf)

    except Exception as e:
        log.error(f"ERRORE id={p.get('id')} {p.get('cognome')}: {e}")
        if not DRY_RUN:
            dst.rollback()
        stats['errori'] += 1

# ============================================
# STEP 4: PATENTI
# ============================================
log.info("=" * 60)
log.info("STEP 3: Patenti/abilitazioni")
src_cursor.execute("""
    SELECT pa.*, ap.codice_fiscale
    FROM anag_patenti_abilitazioni pa
    JOIN anag_persone ap ON ap.id = pa.persona_id
""")
patenti = src_cursor.fetchall()
log.info(f"  Trovate: {len(patenti)} patenti")
pat_stats = {'imp': 0, 'skip': 0, 'err': 0}
for pat in patenti:
    try:
        cf = (pat.get('codice_fiscale') or '').upper()
        if not cf or cf not in cf_set:
            pat_stats['skip'] += 1
            continue
        if not DRY_RUN:
            dst_cursor.execute("SELECT id FROM employees WHERE codice_fiscale=%s", (cf,))
            emp = dst_cursor.fetchone()
            if not emp:
                pat_stats['skip'] += 1
                continue
            tipo_q = PATENTE_MAP.get(pat.get('tipologia', 'altro'), 'altro')
            dst_cursor.execute("""
                INSERT INTO employee_qualifications
                (employee_id, tipo_qualifica, is_attiva, data_conseguimento,
                 data_scadenza, ente_rilascio, numero_documento, created_at, updated_at)
                VALUES (%s,%s,1,%s,%s,%s,%s,NOW(),NOW())
            """, (emp['id'], tipo_q, pat.get('rilasciata_il'), pat.get('scade_il'),
                  (pat.get('rilasciata_da') or '')[:200] or None,
                  (pat.get('numero') or '')[:100] or None))
            dst.commit()
            pat_stats['imp'] += 1
        else:
            pat_stats['imp'] += 1
    except Exception as e:
        log.error(f"ERRORE patente: {e}")
        pat_stats['err'] += 1

# ============================================
# REPORT FINALE
# ============================================
log.info("=" * 60)
log.info("REPORT FINALE")
log.info(f"Organizzazioni: {len(org_id_map)}")
log.info(f"Dipendenti:     {stats['importati']} importati | {stats['aggiornati']} aggiornati | {stats['saltati']} saltati | {stats['errori']} errori")
log.info(f"Patenti:        {pat_stats['imp']} | skip={pat_stats['skip']} | err={pat_stats['err']}")

if not DRY_RUN:
    dst_cursor.execute("SELECT COUNT(*) as cnt FROM employees")
    total = dst_cursor.fetchone()['cnt']
    dst_cursor.execute("SELECT tipo, COUNT(*) as cnt FROM employees GROUP BY tipo")
    per_tipo = dst_cursor.fetchall()
    dst_cursor.execute("SELECT stato, COUNT(*) as cnt FROM employees GROUP BY stato ORDER BY cnt DESC LIMIT 10")
    per_stato = dst_cursor.fetchall()
    log.info(f"\nDB gestionale_cv - employees: {total}")
    for r in per_tipo:
        log.info(f"  {r['tipo']}: {r['cnt']}")
    for r in per_stato:
        log.info(f"  stato={r['stato']}: {r['cnt']}")

src.close()
dst.close()
log.info("Completato!")
