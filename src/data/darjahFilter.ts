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