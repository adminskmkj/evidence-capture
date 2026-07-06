import type { DarjahFilterKey } from '../data/darjahFilter';
import { DARJAH_FILTER_BUTTONS } from '../data/darjahFilter';

interface DarjahFilterBarProps {
  value: DarjahFilterKey;
  onChange: (key: DarjahFilterKey) => void;
  title?: string;
}

/** Butang tapis darjah — ketik D1–D6 / PRA sebelum pilih kelas. */
export function DarjahFilterBar({ value, onChange, title = 'Tap darjah' }: DarjahFilterBarProps) {
  return (
    <div className="darjah-filter-block">
      <p className="darjah-filter-label">{title}</p>
      <div className="darjah-filter-row" role="group" aria-label="Tapis mengikut darjah">
        {DARJAH_FILTER_BUTTONS.map((b) => (
          <button
            className={`darjah-filter-btn ${value === b.key ? 'darjah-filter-btn--active' : ''}`}
            key={b.key}
            onClick={() => onChange(b.key)}
            type="button"
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}