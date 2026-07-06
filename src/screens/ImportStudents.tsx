import { useMemo, useState } from 'react';
import { uploadStudents, type StudentImportRow } from '../api/appsScriptClient';
import {
  buildSubjectDraftsFromRows,
  saveSubjectDrafts,
  type SubjectDraft,
} from '../components/SubjectSetupPanel';
import type { ClassGroup } from '../types/domain';
import { slugId } from '../data/userData';

interface ImportStudentsProps {
  onDone: () => void;
}

type Step = 'idle' | 'parsing' | 'pick-classes' | 'pick-subjects' | 'uploading' | 'done' | 'error';

interface ClassSummary {
  className: string;
  classType: string;
  count: number;
}

export function ImportStudents({ onDone }: ImportStudentsProps) {
  const [step, setStep] = useState<Step>('idle');
  const [allRows, setAllRows] = useState<StudentImportRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const [subjectDrafts, setSubjectDrafts] = useState<SubjectDraft[]>([]);

  const classSummaries = useMemo(() => summarizeClasses(allRows), [allRows]);

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

    try {
      const buf = await file.arrayBuffer();
      const result = await parseExcel(buf);
      setAllRows(result);
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
    const next: Record<string, boolean> = {};
    for (const c of classSummaries) next[c.className] = on;
    setSelected(next);
  }

  function goToSubjectSetup() {
    if (!selectedRows.length) {
      setError('Pilih sekurang-kurangnya satu kelas.');
      setStep('error');
      return;
    }
    setSubjectDrafts(buildSubjectDraftsFromRows(selectedRows));
    setStep('pick-subjects');
  }

  function updateSubjectDraft(key: string, patch: Partial<SubjectDraft>) {
    setSubjectDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  async function handleFinalSave() {
    if (!selectedRows.length) return;
    setStep('uploading');
    setError('');

    const resp = await uploadStudents(selectedRows, 'merge');
    if (!resp.ok) {
      setError(resp.error || 'Gagal simpan murid');
      setStep('error');
      return;
    }

    const classGroups = classesFromImportRows(selectedRows);
    const withNames = subjectDrafts.filter((d) => d.enabled && d.subjectName.trim());
    if (withNames.length) {
      const subResp = await saveSubjectDrafts(withNames, classGroups);
      if (!subResp.ok) {
        setError(subResp.error || 'Murid OK, subjek gagal — setup dalam Tetapan');
        setSavedCount(selectedRows.length);
        setStep('done');
        return;
      }
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
          Header carian automatik: <strong>NAMA</strong>, <strong>NAMA KELAS</strong>, <strong>JENIS KELAS</strong> (fail JBA OK).
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
              {allRows.length} murid dalam fail · {classSummaries.length} kelas. Tick kelas anda, kemudian simpan.
            </p>
            <div className="import-class-actions">
              <button className="form-chip" onClick={() => selectAll(true)} type="button">Pilih semua</button>
              <button className="form-chip" onClick={() => selectAll(false)} type="button">Kosongkan</button>
            </div>
            <ul className="import-class-list">
              {classSummaries.map((c) => (
                <li key={c.className}>
                  <label className="import-class-row">
                    <input
                      checked={!!selected[c.className]}
                      onChange={() => toggleClass(c.className)}
                      type="checkbox"
                    />
                    <span className="import-class-name">{c.className}</span>
                    <span className="import-class-meta">{c.classType || '—'} · {c.count} murid</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              className="primary-action"
              disabled={!selectedRows.length}
              onClick={goToSubjectSetup}
              type="button"
            >
              Seterusnya: setup subjek ({selectedClassCount} kelas)
            </button>
          </>
        )}

        {step === 'pick-subjects' && (
          <>
            <p className="context-note">
              Cadangan dari <strong>JENIS KELAS</strong> + <strong>TAHUN/TINGKATAN</strong> Excel. Isi nama subjek anda (Muzik, Sains, …).
            </p>
            <ul className="subject-draft-list">
              {subjectDrafts.map((d) => (
                <li className="subject-draft-row" key={d.key}>
                  <label className="import-class-row">
                    <input
                      checked={d.enabled}
                      onChange={(e) => updateSubjectDraft(d.key, { enabled: e.target.checked })}
                      type="checkbox"
                    />
                    <span className="import-class-meta">
                      {d.jenisKelas} · {d.yearLevel} · {d.classNames.length} kelas
                    </span>
                  </label>
                  <input
                    className="form-input"
                    onChange={(e) => updateSubjectDraft(d.key, { subjectName: e.target.value })}
                    placeholder="Nama subjek"
                    type="text"
                    value={d.subjectName}
                  />
                </li>
              ))}
            </ul>
            <button className="secondary-action" onClick={() => setStep('pick-classes')} type="button">
              Kembali
            </button>
            <button className="primary-action" onClick={() => void handleFinalSave()} type="button">
              Simpan murid + subjek
            </button>
            <button className="form-chip" onClick={() => { setSubjectDrafts((d) => d.map((x) => ({ ...x, enabled: false }))); void handleFinalSave(); }} type="button">
              Langkau subjek (Tetapan nanti)
            </button>
          </>
        )}

        {step === 'uploading' && (
          <p className="capture-loading">
            Menyimpan {selectedRows.length} murid &amp; subjek… (jangan tutup)
          </p>
        )}

        {step === 'done' && (
          <>
            <p className="context-note">✅ {savedCount} murid dari {selectedClassCount} kelas disimpan.</p>
            <p className="context-note">Subjek boleh dikemas kini dalam Tetapan bila-bila masa.</p>
            <button className="primary-action" onClick={onDone} type="button">
              Mula Guna App
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <p className="capture-error">{error}</p>
            <button className="primary-action" onClick={allRows.length ? () => setStep(step === 'error' && subjectDrafts.length ? 'pick-subjects' : 'pick-classes') : resetAll} type="button">
              {allRows.length ? 'Kembali pilih kelas' : 'Cuba Lagi'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function classesFromImportRows(rows: StudentImportRow[]): ClassGroup[] {
  const map = new Map<string, ClassGroup>();
  for (const r of rows) {
    if (map.has(r.className)) continue;
    map.set(r.className, {
      class_id: slugId(r.className),
      class_name: r.className,
      year_level: r.yearLevel || '—',
      jenis_kelas: r.classType || undefined,
      active: true,
    });
  }
  return [...map.values()];
}

function summarizeClasses(rows: StudentImportRow[]): ClassSummary[] {
  const map = new Map<string, ClassSummary>();
  for (const r of rows) {
    const existing = map.get(r.className);
    if (existing) existing.count += 1;
    else map.set(r.className, { className: r.className, classType: r.classType, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.className.localeCompare(b.className, 'ms'));
}

function normHeader(cell: unknown): string {
  return String(cell ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\.$/, '');
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

function colIndexForTahun(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h === 'TAHUN / TINGKATAN' || h === 'TAHUN/TINGKATAN' || h === 'TINGKATAN' || h === 'TAHUN') return i;
  }
  return -1;
}

async function parseExcel(buf: ArrayBuffer): Promise<StudentImportRow[]> {
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
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(
      'Header NAMA / NAMA KELAS tidak dijumpai. Pastikan fail ada baris tajuk kolum (contoh fail JBA: baris dengan NAMA, NAMA KELAS).',
    );
  }

  const result: StudentImportRow[] = [];

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const studentName = String(row[namaIdx] ?? '').trim();
    const className = String(row[kelasIdx] ?? '').trim();
    const classType = jenisIdx >= 0 ? String(row[jenisIdx] ?? '').trim() : '';
    const yearLevel = tahunIdx >= 0 ? String(row[tahunIdx] ?? '').trim() : '';

    if (!studentName || !className) continue;
    if (normHeader(studentName) === 'NAMA') continue;

    result.push({ className, classType, studentName, yearLevel });
  }

  if (!result.length) {
    throw new Error('Tiada murid dijumpai selepas baris header. Semak kolum NAMA dan NAMA KELAS ada data.');
  }

  return result;
}