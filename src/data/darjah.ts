/**
 * Darjah 1–6 (rendah), Prasekolah, atau label asal jika tidak dikenali.
 */
export function normalizeDarjahLabel(raw: string, className?: string): string {
  const trimmed = String(raw || '').trim();
  if (isCalendarYear(trimmed)) {
    raw = '';
  }

  const fromRaw = parseDarjahNumber(raw);
  if (fromRaw) return `Darjah ${fromRaw}`;

  if (trimmed && !isCalendarYear(trimmed)) {
    if (/prasekolah|^pra\b/i.test(trimmed)) return 'Prasekolah';
    if (looksLikeHeaderLabel(trimmed)) {
      // abaikan teks tajuk kolum yang tersalin ke data
    } else {
      return trimmed;
    }
  }

  const cn = String(className || '').trim();
  if (/^pra/i.test(cn)) return 'Prasekolah';

  const fromClass = parseDarjahFromClassName(cn);
  if (fromClass) return `Darjah ${fromClass}`;

  return '—';
}

export function parseDarjahNumberFromText(text: string): number | null {
  return parseDarjahNumber(text);
}

function isCalendarYear(text: string): boolean {
  const t = String(text || '').trim();
  return /^(19|20)\d{2}$/.test(t);
}

function looksLikeHeaderLabel(text: string): boolean {
  const u = String(text || '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  if (u === 'TAHUN / TINGKATAN' || u === 'DARJAH / TAHUN') return true;
  if (u.includes('TAHUN') && u.includes('TINGKATAN') && u.length > 12) return true;
  return false;
}

function parseDarjahNumber(text: string): number | null {
  const t = String(text || '').trim();
  if (!t || isCalendarYear(t)) return null;
  if (/prasekolah|^pra\b/i.test(t)) return null;
  if (looksLikeHeaderLabel(t)) return null;

  const malayWord = parseMalayDarjahWord(t);
  if (malayWord) return malayWord;

  const patterns = [
    /(?:darjah|tahun|tingkatan|darjah\/tahun)\s*[:-]?\s*(\d)/i,
    /tingkatan\s*(\d)/i,
    /^d\s*(\d)$/i,
    /^(\d)$/,
    /^(\d)\s*[^\d]/,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 6) return n;
    }
  }
  return null;
}

function parseMalayDarjahWord(text: string): number | null {
  const t = String(text || '').trim().toLowerCase();
  const map: Record<string, number> = {
    satu: 1,
    dua: 2,
    tiga: 3,
    empat: 4,
    lima: 5,
    enam: 6,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  };

  const phrase = t.match(/\b(?:tahun|tingkatan|darjah)\s+(satu|dua|tiga|empat|lima|enam)\b/i);
  if (phrase) return map[phrase[1].toLowerCase()] ?? null;

  const word = t.match(/\b(satu|dua|tiga|empat|lima|enam)\b/i);
  if (word) return map[word[1].toLowerCase()] ?? null;

  const compact = t.replace(/[^a-z]/g, '');
  if (compact.startsWith('tahun') || compact.startsWith('tingkatan') || compact.startsWith('darjah')) {
    for (const [name, num] of Object.entries(map)) {
      if (compact.endsWith(name)) return num;
    }
  }

  return map[compact] ?? null;
}

function parseDarjahFromClassName(className: string): number | null {
  const cn = String(className || '').trim();
  const m = cn.match(/^(\d)\s+[A-Za-z\u00C0-\u024F]/) || cn.match(/^(\d)[\s./-]/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 6) return n;
  }
  return null;
}

export function formatYearLevelDisplay(yearLevel: string): string {
  if (!yearLevel || yearLevel === '—') return '—';
  if (isCalendarYear(yearLevel) || looksLikeHeaderLabel(yearLevel)) return '—';
  const n = parseDarjahNumber(yearLevel);
  if (n) return `Darjah ${n}`;
  if (/^darjah\s*\d/i.test(yearLevel)) return yearLevel.replace(/^darjah/i, 'Darjah');
  if (/prasekolah|^pra\b/i.test(yearLevel)) return 'Prasekolah';
  const malay = parseMalayDarjahWord(yearLevel);
  if (malay) return `Darjah ${malay}`;
  return yearLevel;
}