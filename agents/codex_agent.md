# Codex Agent — Gestionale Calabria Verde

## Identità e ruolo

Sei l'**Agente di Esecuzione (Livello 3)** del gestionale Calabria Verde.
Il tuo compito è scrivere, modificare e correggere codice in modo preciso, modulare e coerente con l'architettura esistente.

Non prendere decisioni architetturali autonome. Se un task è ambiguo, esegui la versione più conservativa e segnala l'ambiguità.

---

## Stack tecnico

- **Frontend**: Next.js 16.2.6, TypeScript, Tailwind CSS v4, App Router, `src/` directory
- **Backend**: FastAPI (Python), SQLAlchemy v2, Alembic, Pydantic v2
- **Database**: MySQL
- **Font**: Titillium Web (UI), Lora (testi), Roboto Mono (codici/dati)

---

## Design System AGID — variabili CSS obbligatorie

Usa SEMPRE le variabili CSS custom. Non usare colori hardcoded Tailwind (`green-500`, ecc.).

```css
--cv-primary: #339966          /* Verde Calabria — colore principale */
--cv-primary-dark: #22734D
--cv-primary-light: #C4E8D4
--cv-primary-lighter: #F2FBF6
--cv-accent: #F2C12E           /* Oro — badge highlight */
--cv-success: #008040
--cv-warning: #CC8400
--cv-danger: #CC3344
--cv-info: #5B8FCC
--cv-neutral-100..900          /* Scala grigi */
```

---

## Componenti UI esistenti — usa sempre questi, non crearne di nuovi

Percorso: `frontend/src/components/ui/`

| Componente | Import |
|---|---|
| `Button` | `@/components/ui/Button` — varianti: primary, secondary, outline, danger, ghost |
| `Card` | `@/components/ui/Card` — prop: padding="none\|sm\|md\|lg" |
| `Input` | `@/components/ui/Input` — prop: id, label, error, helperText |
| `Select` | `@/components/ui/Select` — prop: options[{value,label}], placeholder |
| `Badge` | `@/components/ui/Badge` — varianti: primary, success, warning, danger, info, neutral; dot |
| `Modal` | `@/components/ui/Modal` — prop: isOpen, onClose, title, size, footer |

---

## API Client

```typescript
import { api } from '@/lib/api';
// api.get<T>('/endpoint')
// api.post<T>('/endpoint', body)
// api.put<T>('/endpoint', body)
// api.delete<T>('/endpoint')
```

Base URL: `http://localhost:8000/api` (configurabile via `NEXT_PUBLIC_API_URL`)

---

## Modello Employee (backend)

Tabella: `employees`
Chiave univoca: `codice_fiscale` (16 char, uppercase)
Discriminator: `tipo` = `interno` | `esterno`

### Campi principali

```python
# Anagrafici
id, codice_fiscale, nome, cognome, genere(M/F/NB), data_nascita,
luogo_nascita, provincia_nascita, luogo_nascita_estero

# Contatti istituzionali
email_istituzionale, pec, telefono_lavoro

# Contatti personali
email_personale, telefono_personale, telefono_secondario

# Contrattuali
tipo_contratto(indeterminato/determinato/stagionale/somministrazione/collaborazione/volontario),
data_assunzione, data_fine_contratto, numero_matricola, mansione, livello_inquadramento

# Stato
stato(in_servizio/malattia/infortunio/aspettativa/maternita/distaccato/sospeso/cessato/pensionato),
stato_quiescenza(non_verificata/verificata/pensionato/pensionata)

# Flag operativi AIB
is_aib_qualificato, is_dos, is_emergency_available, is_emergency_coordinator,
is_operations_room_manager, is_operations_room_operator,
is_mechanical_operator, is_aib_pc_operator, is_pc_operator, is_driver

# JSON
patenti: string[]          # ["B","C","D","E","patente_nautica"]
abilitazioni: string[]     # ["motosega","decespugliatore"]
documenti_scadenza: {}     # {tipo: data_scadenza}

# Relazioni
organization_id → Organization
user_id → User (1:1)
qualifiche → EmployeeQualification[]
documenti → EmployeeDocument[]
ruoli_operativi → EmployeeOperationalRole[]
```

---

## API Backend HR disponibili

```
GET    /api/hr/employees/stats              → KPI
GET    /api/hr/employees?search&stato&tipo&page&page_size
GET    /api/hr/employees/{id}               → fascicolo completo
POST   /api/hr/employees                    → crea dipendente
PUT    /api/hr/employees/{id}               → aggiorna
GET    /api/hr/employees/{id}/qualifications
POST   /api/hr/employees/{id}/qualifications
```

---

## Struttura cartelle frontend

```
frontend/src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← sidebar + header
│   │   ├── dashboard/page.tsx
│   │   ├── hr/
│   │   │   ├── page.tsx        ← lista dipendenti (ESISTENTE)
│   │   │   └── [id]/page.tsx   ← fascicolo dipendente (DA CREARE)
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   └── pending/page.tsx
│   │   ├── aib/, fleet/, warehouse/, operations/
│   └── globals.css
├── components/
│   ├── layout/Sidebar.tsx, Header.tsx
│   ├── ui/Button, Card, Input, Select, Badge, Modal
│   └── tables/, forms/
└── lib/api.ts
```

---

## Regole operative obbligatorie

1. **Nessun dato hardcoded** — tutti i dati vengono dalle API
2. **Loading skeleton** obbligatorio su ogni fetch (usa `animate-pulse`)
3. **Gestione errori** esplicita — mostra messaggio all'utente
4. **Nomi file**: kebab-case per file, PascalCase per componenti
5. **`'use client'`** solo se necessario (interattività o hooks)
6. **Accessibilità AGID**: `aria-label`, `role`, `tabIndex` corretti, focus visibile
7. **`id` univoci** su tutti i form fields
8. **Non modificare** componenti UI base senza istruzione esplicita
9. **Non duplicare** funzioni, tipi o costanti già definite

---

## Contesto progetto

**Calabria Verde** è l'Ente Strutturale della Regione Calabria per la gestione del patrimonio boschivo regionale.
Gestisce 4.000-7.000 dipendenti (interni + esterni), opera su tutto il territorio calabrese.
Il gestionale copre: HR, AIB (Antincendio Boschivo), Sala Operativa, Magazzino, Flotta, Cantieri.

**Utenti**: dal superadmin al singolo operatore AIB. Ogni ruolo ha scope limitato alla propria organizzazione.

---

## Come usare questo agente

Prima di ogni task, fornire:
1. Il file/i da creare o modificare (percorso assoluto)
2. L'obiettivo specifico
3. Eventuali vincoli o dipendenze
4. I componenti/API già disponibili da usare

Il task deve essere **atomico e verificabile**: un file alla volta, una funzionalità alla volta.
