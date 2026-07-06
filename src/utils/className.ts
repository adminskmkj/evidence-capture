/**
 * Satukan varian nama kelas JBA: "AL FARABI" = "AL-FARABI" = "AL  FARABI".
 * Menyokong pengesahan "AL-" pada mana-mana kedudukan dalam nama kelas (cth: "1 AL-FARABI", "1 AL FARABI").
 */
export function canonicalClassKey(name: string): string {
  const s = String(name || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  const parts = s.split(/[\s\-/]+/).filter(Boolean);
  const alIdx = parts.findIndex((p) => p.toUpperCase() === 'AL');
  if (alIdx >= 0 && alIdx < parts.length - 1) {
    const prefix = parts.slice(0, alIdx);
    const alPart = `AL-${parts.slice(alIdx + 1).join('-')}`.toUpperCase();
    if (prefix.length > 0) {
      return `${prefix.join(' ').toUpperCase()} ${alPart}`;
    }
    return alPart;
  }
  return parts.join(' ').toUpperCase();
}

/** Nama untuk simpan/papar (AL-* guna sengkang, diselaraskan sepenuhnya). */
export function normalizeClassName(name: string): string {
  return canonicalClassKey(name);
}

/**
 * Tambah nombor tahun/Darjah di hadapan nama kelas secara automatik jika belum ada.
 * Contoh: "AL-FARABI" + "Darjah 1" -> "1 AL-FARABI"
 */
export function prefixClassNameWithYear(className: string, yearLevel: string): string {
  const cn = String(className || '').trim();
  if (!cn) return '';

  // Jika sudah bermula dengan nombor digit atau "PRA" (tidak sensitif huruf), jangan tambah prefix
  if (/^\d/i.test(cn) || /^pra/i.test(cn)) {
    return cn;
  }

  const trimmedYear = String(yearLevel || '').trim();
  if (/prasekolah|^pra\b/i.test(trimmedYear)) {
    return `PRA ${cn}`;
  }

  // Dapatkan digit darjah/tahun (1-6)
  const m = trimmedYear.match(/(\d)/);
  if (m) {
    return `${m[1]} ${cn}`;
  }

  // Cari perkataan Melayu/Inggeris (Satu, Dua, dll)
  const malayMap: Record<string, string> = {
    satu: '1', dua: '2', tiga: '3', empat: '4', lima: '5', enam: '6',
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6',
  };
  const compact = trimmedYear.toLowerCase().replace(/[^a-z]/g, '');
  for (const [word, num] of Object.entries(malayMap)) {
    if (compact.includes(word)) {
      return `${num} ${cn}`;
    }
  }

  return cn;
}