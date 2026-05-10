# Brand Guidelines — Gestionale Calabria Verde

Linee guida visive per il gestionale aziendale di Calabria Verde.
Basate sul design system AGID (.italia) con personalizzazione cromatica verde.

---

## Logo

- **File:** `frontend/public/assets/logo-calabriaverde.png`
- **Formato:** PNG scalabile con trasparenza
- **Uso:** header del gestionale, pagina login, footer, report PDF, foto georeferenziate

---

## Colori — Palette Primaria

Adattamento della palette AGID con colore primario verde (anziché Blu Italia), nel rispetto delle regole di contrasto WCAG 2.1 AA.

### Colore Primario (Verde Calabria)

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `primary-lighter` | 150, 62%, 97% | `#F2FBF6` | Sfondo chiaro sezioni |
| `primary-light` | 150, 50%, 85% | `#C4E8D4` | Sfondo card, hover leggero |
| `primary` | 150, 50%, 40% | `#339966` | Azioni primarie, link, bottoni |
| `primary-dark` | 150, 55%, 30% | `#22734D` | Hover bottoni, accenti |
| `primary-darker` | 150, 60%, 20% | `#1A5C3A` | Testo su sfondo chiaro, header |

Contrasto `primary` su bianco: ≥ 4.5:1 ✓
Contrasto `primary-darker` su bianco: ≥ 7:1 ✓

### Colore di Risalto (Accent)

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `accent` | 45, 90%, 50% | `#F2C12E` | Badge, highlight, CTA secondarie |
| `accent-dark` | 45, 90%, 35% | `#A8870A` | Testo accent su chiaro |

### Colori di Sistema (AGID Standard)

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `success` | 160, 100%, 25% | `#008040` | Operazione completata |
| `warning` | 36, 100%, 40% | `#CC8400` | Attenzione |
| `danger` | 350, 60%, 50% | `#CC3344` | Errore, azione distruttiva |
| `info` | 210, 72%, 57% | `#5B8FCC` | Informazione |

### Colori Neutri

| Token | HSL | Hex | Uso |
|-------|-----|-----|-----|
| `neutral-100` | 0, 0%, 98% | `#FAFAFA` | Sfondo pagina |
| `neutral-200` | 0, 0%, 96% | `#F5F5F5` | Sfondo alternato |
| `neutral-300` | 0, 0%, 90% | `#E6E6E6` | Bordi leggeri |
| `neutral-400` | 0, 0%, 83% | `#D4D4D4` | Bordi, separatori |
| `neutral-500` | 0, 0%, 64% | `#A3A3A3` | Testo disabilitato |
| `neutral-600` | 210, 12%, 52% | `#748A9D` | Testo secondario |
| `neutral-700` | 210, 17%, 44% | `#5D7083` | Label, caption |
| `neutral-800` | 0, 0%, 25% | `#404040` | Testo corpo |
| `neutral-900` | 0, 0%, 15% | `#262626` | Testo intestazioni |
| `white` | 0, 0%, 100% | `#FFFFFF` | Sfondo card, modali |

---

## Tipografia (AGID Standard)

### Font Primario — Titillium Web

Usare per: titoli, sottotitoli, bottoni, label, elementi interattivi, paragrafi brevi.

```css
@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&display=swap');
```

### Font Secondario — Lora (serif)

Usare per: testi lunghi, paragrafi estesi, contenuti editoriali.

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap');
```

### Font Monospazio — Roboto Mono

Usare per: codici, dati tecnici, coordinate GPS, codici fiscali.

```css
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap');
```

### Scala Tipografica

| Stile | Font | Dimensione | Line-height | Peso |
|-------|------|------------|-------------|------|
| H1 | Titillium Web | 40px / 48px mobile | 48px / 56px | Bold (700) |
| H2 | Titillium Web | 32px / 40px mobile | 40px / 48px | Bold (700) |
| H3 | Titillium Web | 28px / 32px mobile | 32px / 40px | Bold (700) |
| H4 | Titillium Web | 24px / 32px mobile | 32px / 40px | SemiBold (600) |
| H5 | Titillium Web | 20px / 24px mobile | 24px / 32px | SemiBold (600) |
| H6 | Titillium Web | 16px / 18px mobile | 24px | SemiBold (600) |
| Lead | Titillium Web | 20px / 24px mobile | 32px | Regular (400) |
| Body | Titillium Web | 16px / 18px mobile | 24px | Regular (400) |
| Body serif | Lora | 16px / 18px mobile | 24px | Regular (400) |
| Label | Titillium Web | 16px / 18px mobile | 24px | SemiBold (600) |
| Caption | Titillium Web | 14px | 16px | Regular (400) |
| Mono | Roboto Mono | 14px | 20px | Regular (400) |

Lunghezza massima paragrafo: **75 caratteri per riga**.

---

## Spaziature

Baseline grid: **4px**. Tutte le spaziature sono multipli di 4px.

| Token | Valore |
|-------|--------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

---

## Bordi e Raggi

| Token | Valore | Uso |
|-------|--------|-----|
| `border-width` | 1px | Bordi standard |
| `border-color` | neutral-300 | Bordo predefinito |
| `radius-sm` | 4px | Input, badge |
| `radius-md` | 8px | Card, modali |
| `radius-lg` | 16px | Container principali |
| `radius-full` | 9999px | Avatar, pill |

---

## Ombre

| Token | Valore | Uso |
|-------|--------|-----|
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.06) | Bottoni, input |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | Card, dropdown |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modali, popover |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1) | Dialog, overlay |

---

## Breakpoint Responsive

| Nome | Valore | Descrizione |
|------|--------|-------------|
| `sm` | 576px | Smartphone landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 992px | Tablet landscape / desktop |
| `xl` | 1200px | Desktop |
| `xxl` | 1400px | Desktop grande |

Mobile-first: progettare prima per mobile, poi espandere.

---

## Componenti AGID Base

Elenco componenti da implementare nel design system (da `designers.italia.it`):

- Accordion
- Alert (success, warning, danger, info)
- Avatar
- Badge
- Breadcrumbs
- Button (primary, secondary, outline, danger, ghost)
- Card
- Checkbox
- Datepicker
- Dropdown / Select
- Footer istituzionale
- Form (input, textarea, select, radio, checkbox)
- Header istituzionale
- Input
- List
- Modal
- Notifications (in-app, toast)
- Pagination
- Progress indicators
- Sidebar
- Skiplinks (accessibilità)
- Steppers
- Tables (con ordinamento e paginazione)
- Tabs
- Timeline
- Toggles
- Toolbar
- Tooltip
- Upload file

---

## Accessibilità (WCAG 2.1 AA)

- Contrasto testo: ≥ 4.5:1
- Contrasto testo grande (>24px): ≥ 3:1
- Contrasto elementi grafici/interfaccia: ≥ 3:1
- Navigazione completa da tastiera
- Focus visibile su ogni elemento interattivo
- Skiplinks in alto
- `aria-label` e `role` su elementi interattivi
- Screen reader compatibile
- Alt text su tutte le immagini
- Nessun contenuto solo colore (usare icone + testo)

---

## Tono Visivo

- **Istituzionale ma moderno** — professionale senza essere austero
- **Dinamico** — micro-animazioni, transizioni fluide, feedback visivo
- **Pulito** — spaziature generose, gerarchia chiara, nessun elemento decorativo superfluo
- **Verde natura** — richiamo al patrimonio forestale, sensazione di affidabilità e cura del territorio
