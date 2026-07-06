import { useMemo, useState } from 'react';
import { uploadStudents, type StudentImportRow } from '../api/appsScriptClient';
import { DarjahFilterBar } from '../components/DarjahFilterBar';
import { formatYearLevelDisplay, normalizeDarjahLabel } from '../data/darjah';
import { type DarjahFilterKey, filterClassesByDarjah } from '../data/darjahFilter';

interface ImportStudentsProps {
  onDone: () => void;
}

type Step = 'idle' | 'parsing' | 'pick-classes' | 'uploading' | 'done' | 'error';

interface ClassSummary {
  className: string;
  classType: string;
  darjah: string;
  count: number;
}

export function ImportStudents({ onDone }: ImportStudentsProps) {
  const [step, setStep] = useState<Step>('idle');
  const [allRows, setAllRows] = useState<StudentImportRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const [darjahFilter, setDarjahFilter] = useState<DarjahFilterKey>('all');
  const [darjahColumnFound, setDarjahColumnFound] = useState(false);

  const classSummaries = useMemo(() => summarizeClasses(allRows), [allRows]);

  const { list: visibleClassSummaries, darjahDataMissing } = useMemo(() => {
    const mapped = classSummaries.map((c) => ({
      ...c,
      class_name: c.className,
      year_level: c.darjah,
    }));
    const r = filterClassesByDarjah(mapped, darjahFilter, '');
    return { list: r.list, darjahDataMissing: r.darjahDataMissing };
  }, [classSummaries, darjahFilter]);

  const selectedRows = useMemo(
    () => allRows.filter((r) => selected[r.className]),
    [allRows, selected],
  );

  const selectedClassCount = useMemo(
    () => classSummaries.filter((c) => selected[c.className]).length,
    [classSummaries, selected],
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setStep('parsing');
    setError('');
    setAllRows([]);
    setSelected({});
    setDarjahFilter('all');
    setDarjahColumnFound(false);

    try {
      const buf = await file.arrayBuffer();
      const { rows, darjahColumnFound: foundDarjah } = await parseExcel(buf);
      setAllRows(rows);
      setDarjahColumnFound(foundDarjah);
      setStep('pick-classes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ralat baca fail');
      setStep('error');
    }
  }

  function toggleClass(className: string) {
    setSelected((prev) => ({ ...prev, [className]: !prev[className] }));
  }

  function selectAll(on: boolean) {
    const next = { ...selected };
    for (const c of visibleClassSummaries) next[c.className] = on;
    setSelected(next);
  }

  async function handleSaveMurid() {
    if (!selectedRows.length) {
      setError('Pilih sekurang-kurangnya satu kelas.');
      setStep('error');
      return;
    }
    setStep('uploading');
    setError('');

    const resp = await uploadStudents(selectedRows, 'merge');
    if (!resp.ok) {
      setError(resp.error || 'Gagal simpan murid');
      setStep('error');
      return;
    }

    setSavedCount(selectedRows.length);
    setStep('done');
  }

  function resetAll() {
    setStep('idle');
    setError('');
    setAllRows([]);
    setSelected({});
    setSavedCount(0);
    setDarjahFilter('all');
    setDarjahColumnFound(false);
  }

  return (
    <div className="login-screen">
      <div className="login-card import-card">
        <p className="eyebrow">Import Murid</p>
        <h1>Muat Naik Senarai Murid</h1>
        <p className="hero-copy">
          Fail sekolah ada ramai kelas — <strong>pilih kelas yang anda ajar sahaja</strong>. App hanya simpan kelas yang ditick.
        </p>
        <p className="login-warning">
          Header: <strong>NAMA</strong>, <strong>NAMA KELAS</strong>, <strong>DARJAH</strong> atau <strong>TAHUN / TINGKATAN</strong>,{' '}
          <strong>JENIS KELAS</strong> (fail JBA).
        </p>

        {(step === 'idle' || step === 'error') && (
          <label className="primary-action" style={{ textAlign: 'center', cursor: 'pointer' }}>
            Pilih Fail Excel
            <input accept=".xlsx,.xls" hidden onChange={handleFile} type="file" />
          </label>
        )}

        {step === 'parsing' && <p className="capture-loading">Membaca fail…</p>}

        {step === 'pick-classes' && (
          <>
            <p className="context-note">
              {allRows.length} murid · {classSummaries.length} kelas dalam fail. Simpan ke Sheet, kemudian Tetapan → pilih <strong>kelas yang anda ajar</strong> + subjek.
            </p>
            <DarjahFilterBar onChange={setDarjahFilter} title="① Ketik darjah — tapis senarai kelas" value={darjahFilter} />
            {darjahColumnFound ? (
              <p className="context-note">
                Kolum <strong>DARJAH</strong> atau <strong>TAHUN / TINGKATAN</strong> dijumpai dalam Excel.
              </p>
            ) : (
              <p className="context-note">Kolum DARJAH tidak dijumpai — darjah dari nama kelas (cth. 1 BESTARI).</p>
            )}
            <div className="import-class-actions">
              <button className="form-chip" onClick={() => selectAll(true)} type="button">Pilih semua</button>
              <button className="form-chip" onClick={() => selectAll(false)} type="button">Kosongkan</button>
            </div>
            <ul className="import-class-list">
              {visibleClassSummaries.map((c) => (
                <li key={c.className}>
                  <label className="import-class-row">
                    <input
                      checked={!!selected[c.className]}
                      onChange={() => toggleClass(c.className)}
                      type="checkbox"
                    />
                    <span className="import-class-name">{c.className}</span>
                    <span className="import-class-meta">
                      {c.darjah !== '—' ? `${c.darjah} · ` : ''}
                      {c.classType || '—'} · {c.count} murid
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {darjahDataMissing && (
              <p className="login-warning">
                Darjah kosong dalam fail — butang D1–D6 tidak tapis. Pastikan kolum <strong>DARJAH</strong> wujud; nilai kosong diisi dari baris atas (JBA).
              </p>
            )}
            {!visibleClassSummaries.length && !darjahDataMissing && (
              <p className="context-note">Tiada kelas untuk darjah ini. Ketik <strong>Semua</strong> atau darjah lain.</p>
            )}
            <button
              className="primary-action"
              disabled={!selectedRows.length}
              onClick={() => void handleSaveMurid()}
              type="button"
            >
              Simpan {selectedRows.length} murid ({selectedClassCount} kelas)
            </button>
          </>
        )}

        {step === 'uploading' && (
          <p className="capture-loading">
            Menyimpan {selectedRows.length} murid… (jangan tutup)
          </p>
        )}

        {step === 'done' && (
          <>
            <p className="context-note">✅ {savedCount} murid dari {selectedClassCount} kelas disimpan.</p>
            <p className="context-note">
              Seterusnya: <strong>Tetapan → Setup kelas &amp; subjek</strong> — pilih kelas yang anda ajar + subjek (bukan semua kelas Sheet).
            </p>
            <button className="primary-action" onClick={onDone} type="button">
              Mula Guna App
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <p className="capture-error">{error}</p>
            <button className="primary-action" onClick={allRows.length ? () => setStep('pick-classes') : resetAll} type="button">
              {allRows.length ? 'Kembali pilih kelas' : 'Cuba Lagi'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function summarizeClasses(rows: StudentImportRow[]): ClassSummary[] {
  const map = new Map<string, ClassSummary & { yearCounts: Record<string, number> }>();
  for (const r of rows) {
    const y = formatYearLevelDisplay(r.yearLevel || '');
    const existing = map.get(r.className);
    if (existing) {
      existing.count += 1;
      if (y !== '—') existing.yearCounts[y] = (existing.yearCounts[y] || 0) + 1;
    } else {
      map.set(r.className, {
        className: r.className,
        classType: r.classType,
        darjah: y,
        count: 1,
        yearCounts: y !== '—' ? { [y]: 1 } : {},
      });
    }
  }
  return [...map.values()]
    .map(({ yearCounts, ...c }) => {
      let best = c.darjah;
      let n = 0;
      for (const [y, cnt] of Object.entries(yearCounts)) {
        if (cnt > n) {
          n = cnt;
          best = y;
        }
      }
      return { ...c, darjah: best };
    })
    .sort((a, b) => a.className.localeCompare(b.className, 'ms'));
}

function normHeader(cell: unknown): string {
  return String(cell ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\*/g, '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\.$/, '');
}

function colIndexForTahun(headers: string[]): number {
  const order = [
    'DARJAH',
    'BIL',
    'TINGKATAN',
    'TAHUN / TINGKATAN',
    'TAHUN/TINGKATAN',
    'DARJAH / TAHUN',
    'TAHUN',
  ];
  for (const want of order) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === want) return i;
    }
  }
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (!h) continue;
    if (h.includes('DARJAH') && !h.includes('TAHUN')) return i;
    if (h === 'BIL' || h.startsWith('BIL ')) return i;
    if (h.includes('TAHUN') && h.includes('TINGKATAN')) return i;
  }
  return -1;
}

function findTahunColumnInMatrix(matrix: unknown[][], scanLimit: number): number {
  for (let r = 0; r < scanLimit; r++) {
    const headers = (matrix[r] || []).map(normHeader);
    const ti = colIndexForTahun(headers);
    if (ti >= 0) return ti;
  }
  return -1;
}
function colIndexForNama(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'NAMA') return i;
    if (h.includes('NAMA MURID') && !h.includes('KELAS')) return i;
  }
  return -1;
}

function colIndexForKelas(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'NAMA KELAS' || h === 'KELAS') return i;
  }
  return -1;
}

function colIndexForJenis(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'JENIS KELAS') return i;
  }
  return -1;
}

function looksLikeHeaderCell(text: string): boolean {
  const u = normHeader(text);
  return u.includes('TAHUN') && u.includes('TINGKATAN');
}

async function parseExcel(buf: ArrayBuffer): Promise<{ rows: StudentImportRow[]; darjahColumnFound: boolean }> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][];

  let headerRowIdx = -1;
  let namaIdx = -1;
  let kelasIdx = -1;
  let jenisIdx = -1;
  let tahunIdx = -1;

  const scanLimit = Math.min(matrix.length, 40);
  const tahunColFromAnyRow = findTahunColumnInMatrix(matrix, scanLimit);

  for (let r = 0; r < scanLimit; r++) {
    const row = matrix[r] || [];
    const headers = row.map(normHeader);
    const ni = colIndexForNama(headers);
    const ki = colIndexForKelas(headers);
    if (ni >= 0 && ki >= 0) {
      headerRowIdx = r;
      namaIdx = ni;
      kelasIdx = ki;
      jenisIdx = colIndexForJenis(headers);
      tahunIdx = colIndexForTahun(headers);
      if (tahunIdx < 0) tahunIdx = tahunColFromAnyRow;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'Header NAMA / NAMA KELAS tidak dijumpai. Pastikan fail ada baris tajuk kolum (contoh fail JBA: baris dengan NAMA, NAMA KELAS).',
    );
  }

  if (tahunIdx < 0) tahunIdx = tahunColFromAnyRow;

  const result: StudentImportRow[] = [];
  let carryDarjah = '';

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const studentName = String(row[namaIdx] ?? '').trim();
    const className = String(row[kelasIdx] ?? '').trim();
    const classType = jenisIdx >= 0 ? String(row[jenisIdx] ?? '').trim() : '';
    let rawYear = tahunIdx >= 0 ? String(row[tahunIdx] ?? '').trim() : '';
    if (rawYear && !looksLikeHeaderCell(rawYear)) {
      carryDarjah = rawYear;
    } else if (carryDarjah && tahunIdx >= 0) {
      rawYear = carryDarjah;
    }
    const yearLevel = normalizeDarjahLabel(rawYear, className);

    if (!studentName || !className) continue;
    if (normHeader(studentName) === 'NAMA') continue;

    result.push({ className, classType, studentName, yearLevel });
  }

  if (!result.length) {
    throw new Error('Tiada murid dijumpai selepas baris header. Semak kolum NAMA dan NAMA KELAS ada data.');
  }

  return { rows: result, darjahColumnFound: tahunIdx >= 0 };
}