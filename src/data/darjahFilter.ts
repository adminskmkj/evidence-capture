import { formatYearLevelDisplay, parseDarjahNumberFromText } from './darjah';

export type DarjahFilterKey = 'all' | 'pra' | '1' | '2' | '3' | '4' | '5' | '6';

export const DARJAH_FILTER_BUTTONS: { key: DarjahFilterKey; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pra', label: 'PRA' },
  { key: '1', label: 'D1' },
  { key: '2', label: 'D2' },
  { key: '3', label: 'D3' },
  { key: '4', label: 'D4' },
  { key: '5', label: 'D5' },
  { key: '6', label: 'D6' },
];

/** Boleh dipadankan dengan butang D1–D6 / PRA (bukan tahun 2025 atau tajuk kolum). */
export function isDarjahFilterable(yearOrDarjah: string): boolean {
  return darjahKeyFromLabel(yearOrDarjah) !== 'all';
}

/** @deprecated guna isDarjahFilterable */
export function isDarjahKnown(yearOrDarjah: string): boolean {
  return isDarjahFilterable(yearOrDarjah);
}

export function darjahKeyFromLabel(yearOrDarjah: string): DarjahFilterKey {
  const raw = String(yearOrDarjah || '').trim();
  const n = parseDarjahNumberFromText(raw);
  if (n) return String(n) as DarjahFilterKey;

  const d = formatYearLevelDisplay(yearOrDarjah);
  if (d === 'Prasekolah') return 'pra';
  const m = d.match(/^Darjah\s*(\d)/i);
  if (m) {
    const num = m[1];
    if (['1', '2', '3', '4', '5', '6'].includes(num)) return num as DarjahFilterKey;
  }
  return 'all';
}

export function matchesDarjahFilter(yearOrDarjah: string, filter: DarjahFilterKey): boolean {
  if (filter === 'all') return true;
  return darjahKeyFromLabel(yearOrDarjah) === filter;
}

/** Senarai kelas ikut darjah; jika tiada kelas ber-darjah dalam data, jangan kosongkan skrin. */
export function filterClassesByDarjah<T extends { year_level: string; class_name: string }>(
  classes: T[],
  filter: DarjahFilterKey,
  searchQuery: string,
): { list: T[]; darjahDataMissing: boolean; filterHadNoMatch: boolean } {
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    return {
      list: classes.filter((c) => c.class_name.toLowerCase().includes(q)),
      darjahDataMissing: false,
      filterHadNoMatch: false,
    };
  }

  const filterable = classes.filter((c) => isDarjahFilterable(c.year_level));
  const darjahDataMissing = classes.length > 0 && filterable.length === 0;

  if (filter === 'all' || darjahDataMissing) {
    return { list: classes, darjahDataMissing, filterHadNoMatch: false };
  }

  const list = classes.filter((c) => matchesDarjahFilter(c.year_level, filter));
  return {
    list,
    darjahDataMissing: false,
    filterHadNoMatch: list.length === 0 && filterable.length > 0,
  };
}