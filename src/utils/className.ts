/**
 * Satukan varian nama kelas JBA: "AL FARABI" = "AL-FARABI" = "AL  FARABI".
 */
export function canonicalClassKey(name: string): string {
  const s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  const parts = s.split(/[\s\-/]+/).filter(Boolean);
  if (parts.length >= 2 && parts[0].toUpperCase() === 'AL') {
    return `AL-${parts.slice(1).join('-')}`.toUpperCase();
  }
  return parts.join(' ').toUpperCase();
}

/** Nama untuk simpan/papar (AL-* guna sengkang). */
export function normalizeClassName(name: string): string {
  const key = canonicalClassKey(name);
  if (key.startsWith('AL-')) return key;
  return String(name || '').trim().replace(/\s+/g, ' ');
}