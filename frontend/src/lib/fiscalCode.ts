const MONTH_CODES = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'] as const;
const ODD_MAP: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};
const EVEN_MAP: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12,
  N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
};
const CHECK_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type FiscalCodeAnalysis = {
  normalized: string;
  isFormatValid: boolean;
  isCheckCharValid: boolean;
  year?: number;
  month?: number;
  day?: number;
  gender?: 'M' | 'F';
  placeCode?: string;
  extractedSurnameCode?: string;
  extractedNameCode?: string;
};

export type FiscalCodeGenerationInput = {
  surname: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F';
  placeCode: string;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

function consonants(value: string): string[] {
  return normalizeText(value).split('').filter((char) => !'AEIOU'.includes(char));
}

function vowels(value: string): string[] {
  return normalizeText(value).split('').filter((char) => 'AEIOU'.includes(char));
}

function encodeSurname(value: string): string {
  const chars = [...consonants(value), ...vowels(value), 'X', 'X', 'X'];
  return chars.slice(0, 3).join('');
}

function encodeName(value: string): string {
  const cons = consonants(value);
  if (cons.length >= 4) {
    return [cons[0], cons[2], cons[3]].join('');
  }
  const chars = [...cons, ...vowels(value), 'X', 'X', 'X'];
  return chars.slice(0, 3).join('');
}

function encodeDatePart(birthDate: string, gender: 'M' | 'F'): string {
  const [yearRaw, monthRaw, dayRaw] = birthDate.split('-').map(Number);
  const year = String(yearRaw % 100).padStart(2, '0');
  const month = MONTH_CODES[(monthRaw || 1) - 1] || 'A';
  const day = String(gender === 'F' ? dayRaw + 40 : dayRaw).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function computeFiscalCodeCheckChar(partial: string): string {
  const normalized = partial.toUpperCase();
  let sum = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    sum += (i % 2 === 0 ? ODD_MAP[char] : EVEN_MAP[char]) ?? 0;
  }
  return CHECK_CHARS[sum % 26];
}

export function generateFiscalCode(input: FiscalCodeGenerationInput): string {
  const partial = `${encodeSurname(input.surname)}${encodeName(input.name)}${encodeDatePart(input.birthDate, input.gender)}${input.placeCode.trim().toUpperCase()}`;
  return `${partial}${computeFiscalCodeCheckChar(partial)}`;
}

export function analyzeFiscalCode(rawValue: string): FiscalCodeAnalysis {
  const normalized = rawValue.trim().toUpperCase();
  const format = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  const isFormatValid = format.test(normalized);

  if (!isFormatValid) {
    return {
      normalized,
      isFormatValid,
      isCheckCharValid: false,
    };
  }

  const partial = normalized.slice(0, 15);
  const expectedCheckChar = computeFiscalCodeCheckChar(partial);
  const monthCode = normalized[8];
  const month = MONTH_CODES.indexOf(monthCode as typeof MONTH_CODES[number]) + 1;
  const rawDay = Number(normalized.slice(9, 11));
  const gender = rawDay > 40 ? 'F' : 'M';
  const day = rawDay > 40 ? rawDay - 40 : rawDay;
  const yy = Number(normalized.slice(6, 8));
  const currentYY = new Date().getFullYear() % 100;
  const year = yy <= currentYY ? 2000 + yy : 1900 + yy;

  return {
    normalized,
    isFormatValid: true,
    isCheckCharValid: normalized[15] === expectedCheckChar,
    year,
    month,
    day,
    gender,
    placeCode: normalized.slice(11, 15),
    extractedSurnameCode: normalized.slice(0, 3),
    extractedNameCode: normalized.slice(3, 6),
  };
}
