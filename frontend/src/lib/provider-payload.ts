const PROVIDER_LABELS: Record<string, string> = {
  carmakecurrenttextvalue: 'Marca',
  carmodelcurrenttextvalue: 'Modello',
  description: 'Descrizione commerciale',
  enginesizecurrenttextvalue: 'Cilindrata',
  fueltypecurrenttextvalue: 'Alimentazione',
  imageurl: 'Immagine veicolo',
  ktype: 'Codice K-Type',
  makedescriptioncurrenttextvalue: 'Marca dichiarata',
  modeldescriptioncurrenttextvalue: 'Modello dichiarato',
  powercv: 'Potenza CV',
  powerfiscal: 'Potenza fiscale',
  powerkw: 'Potenza kW',
  registrationdate: 'Data immatricolazione',
  firstregistrationdate: 'Prima immatricolazione',
  registrationyear: 'Anno immatricolazione',
  version: 'Versione/allestimento',
  vehicleimageurl: 'Immagine veicolo',
  co2: 'Emissioni CO2',
  doors: 'Porte',
  seats: 'Posti',
  source: 'Fonte dati',
};

const UNIQUE_VEHICLE_KEYS = new Set([
  'vin',
  'vehicleidentificationnumber',
  'vechileidentificationnumber',
  'chassisnumber',
  'registrationnumber',
  'licenseplate',
  'targa',
]);

const DUPLICATED_STRUCTURED_KEYS = new Set([
  'carmakecurrenttextvalue',
  'carmodelcurrenttextvalue',
  'description',
]);

function normalizedProviderKey(label: string) {
  return label.toLowerCase().replace(/[\s._-]+/g, '');
}

function humanizeProviderLabel(label: string) {
  const direct = PROVIDER_LABELS[normalizedProviderKey(label)];
  if (direct) return direct;

  const leaf = label.split('.').pop() || label;
  const leafMatch = PROVIDER_LABELS[normalizedProviderKey(leaf)];
  if (leafMatch) return leafMatch;

  return leaf
    .replace(/CurrentTextValue/gi, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

export function flattenProviderPayload(value: unknown, prefix = '', rows: Array<{ label: string; value: string }> = []) {
  if (value === null || value === undefined || value === '') return rows;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenProviderPayload(item, `${prefix}[${index}]`, rows));
    return rows;
  }
  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      flattenProviderPayload(item, prefix ? `${prefix}.${key}` : key, rows);
    });
    return rows;
  }
  rows.push({ label: prefix, value: String(value) });
  return rows;
}

export function providerDisplayFields(payload?: Record<string, unknown> | null, limit = 120) {
  const seen = new Set<string>();

  return flattenProviderPayload(payload)
    .filter((item) => {
      const key = normalizedProviderKey(item.label);
      if (!item.label || !item.value || UNIQUE_VEHICLE_KEYS.has(key) || DUPLICATED_STRUCTURED_KEYS.has(key)) return false;
      const signature = `${key}:${item.value}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .map((item) => ({ ...item, label: humanizeProviderLabel(item.label) }))
    .filter((item) => item.label)
    .slice(0, limit);
}
