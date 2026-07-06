/**
 * Darjah 1–6 (rendah), Prasekolah, atau label asal jika tidak dikenali.
 */
export function normalizeDarjahLabel(raw: string, className?: string): string {
  const fromRaw = parseDarjahNumber(raw);
  if (fromRaw) return `Darjah ${fromRaw}`;

  const trimmed = String(raw || '').trim();
  if (trimmed) {
    if (/prasekolah|^pra\b/i.test(trimmed)) return 'Prasekolah';
    return trimmed;
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

function parseDarjahNumber(text: string): number | null {
  const t = String(text || '').trim();
  if (!t) return null;
  if (/prasekolah|^pra\b/i.test(t)) return null;

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
  const n = parseDarjahNumber(yearLevel);
  if (n) return `Darjah ${n}`;
  if (/^darjah\s*\d/i.test(yearLevel)) return yearLevel.replace(/^darjah/i, 'Darjah');
  if (/prasekolah|^pra\b/i.test(yearLevel)) return 'Prasekolah';
  return yearLevel;
}