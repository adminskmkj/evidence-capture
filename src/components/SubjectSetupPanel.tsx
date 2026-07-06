import { useMemo, useState } from 'react';
import { saveSubjects, type SubjectSaveRow } from '../api/appsScriptClient';
import {
  type ClassSubjectLine,
  linesFromSubjects,
  subjectsFromClassSubjectLines,
  subjectsToApiPayload,
} from '../data/subjectSetup';
import type { ClassGroup, Subject } from '../types/domain';
import { DarjahFilterBar } from './DarjahFilterBar';
import { formatYearLevelDisplay } from '../data/darjah';
import { type DarjahFilterKey, matchesDarjahFilter } from '../data/darjahFilter';

interface SubjectSetupPanelProps {
  allClasses: ClassGroup[];
  existingSubjects: Subject[];
  onSaved: () => void;
}

export function SubjectSetupPanel({ allClasses, existingSubjects, onSaved }: SubjectSetupPanelProps) {
  const [lines, setLines] = useState<ClassSubjectLine[]>(() => linesFromSubjects(existingSubjects, allClasses));
  const [pickClassId, setPickClassId] = useState('');
  const [pickSubject, setPickSubject] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [darjahFilter, setDarjahFilter] = useState<DarjahFilterKey>('all');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const classById = useMemo(() => new Map(allClasses.map((c) => [c.class_id, c])), [allClasses]);
  const pickedClass = pickClassId ? classById.get(pickClassId) : undefined;
  const validLines = useMemo(() => lines.filter((l) => l.classId && l.subjectName.trim()), [lines]);

  const filteredClasses = useMemo(() => {
    const q = classFilter.trim().toLowerCase();
    return allClasses.filter((c) => {
      if (!matchesDarjahFilter(c.year_level, darjahFilter)) return false;
      if (!q) return true;
      return c.class_name.toLowerCase().includes(q);
    });
  }, [allClasses, classFilter, darjahFilter]);

  function pickClass(id: string) {
    setPickClassId(id);
    setError('');
    setStatus('idle');
  }

  function addLine() {
    const classId = pickClassId;
    const subjectName = pickSubject.trim();
    if (!classId) {
      setError('Pilih kelas dalam senarai di bawah (ketik satu baris kelas).');
      setStatus('error');
      return;
    }
    if (!subjectName) {
      setError('Isi nama subjek, kemudian + Tambah.');
      setStatus('error');
      return;
    }
    setError('');
    setStatus('idle');
    setLines((prev) => [
      ...prev,
      { id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, classId, subjectName },
    ]);
    setPickSubject('');
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLineSubject(id: string, subjectName: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, subjectName } : l)));
  }

  async function handleSave() {
    if (!validLines.length) {
      setError('Tambah sekurang-kurangnya satu kelas + subjek.');
      setStatus('error');
      return;
    }

    const subjects = subjectsFromClassSubjectLines(validLines, allClasses);
    const payload: SubjectSaveRow[] = subjectsToApiPayload(subjects, allClasses).map((s) => ({
      subject_id: s.subject_id || '',
      subject_name: s.subject_name || '',
      year_level: s.year_level || '',
      jenis_kelas: s.jenis_kelas || '',
      class_names: s.class_names || [],
    }));

    setStatus('saving');
    setError('');
    const resp = await saveSubjects(payload, { replaceAll: true });
    if (resp.ok) {
      setStatus('idle');
      onSaved();
    } else {
      setError(resp.error || 'Gagal simpan');
      setStatus('error');
    }
  }

  return (
    <div className="subject-setup">
      {allClasses.length === 0 ? (
        <p className="login-warning">
          Tiada kelas dalam Sheet. Guna <strong>Muat naik Excel</strong> di panel atas.
        </p>
      ) : (
        <>
          <DarjahFilterBar
            onChange={setDarjahFilter}
            title="① Ketik darjah (D1–D6 / PRA) — terus di halaman ini"
            value={darjahFilter}
          />

          <div className="setup-step-block">
            <h4 className="setup-step-title">② Pilih kelas (ketik satu baris)</h4>
            <input
              className="form-input"
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Cari nama kelas…"
              type="search"
              value={classFilter}
            />
            {pickedClass && (
              <p className="context-note setup-picked-hint">
                Kelas dipilih: <strong>{pickedClass.class_name}</strong>
                {pickedClass.year_level !== '—' ? ` · ${formatYearLevelDisplay(pickedClass.year_level)}` : ''}
              </p>
            )}
            <ul className="import-class-list setup-class-inline-list">
              {filteredClasses.map((c) => (
                <li key={c.class_id}>
                  <button
                    className={`import-class-row setup-class-pick-btn ${pickClassId === c.class_id ? 'setup-class-pick-btn--active' : ''}`}
                    onClick={() => pickClass(c.class_id)}
                    type="button"
                  >
                    <span className="import-class-name">{c.class_name}</span>
                    <span className="import-class-meta">
                      {formatYearLevelDisplay(c.year_level)}
                      {c.jenis_kelas ? ` · ${c.jenis_kelas}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!filteredClasses.length && (
              <p className="context-note">Tiada kelas. Ketik <strong>Semua</strong> atau darjah lain.</p>
            )}
          </div>

          <div className="setup-step-block">
            <h4 className="setup-step-title">③ Subjek untuk kelas itu</h4>
            <div className="class-subject-add">
              <input
                className="form-input"
                onChange={(e) => setPickSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLine();
                  }
                }}
                placeholder="cth: Muzik, Sains, PSV…"
                type="text"
                value={pickSubject}
              />
              <button className="primary-action" onClick={addLine} type="button">
                + Tambah
              </button>
            </div>
            <p className="context-note">
              Kelas sama, 2 subjek? Pilih kelas yang sama lagi, isi subjek lain, Tambah.
            </p>
          </div>

          <p className="context-note">
            Anda ajar <strong>{new Set(validLines.map((l) => l.classId)).size}</strong> kelas ·{' '}
            <strong>{validLines.length}</strong> baris (kelas+subjek)
          </p>

          <h4 className="setup-step-title">Senarai setup anda</h4>
          <ul className="subject-draft-list">
            {lines.map((line) => {
              const c = classById.get(line.classId);
              return (
                <li className="subject-draft-row class-subject-line" key={line.id}>
                  <div className="class-subject-line__head">
                    <strong>{c?.class_name || 'Kelas?'}</strong>
                    <button className="form-chip" onClick={() => removeLine(line.id)} type="button">
                      Buang
                    </button>
                  </div>
                  <input
                    className="form-input"
                    onChange={(e) => updateLineSubject(line.id, e.target.value)}
                    placeholder="Nama subjek"
                    type="text"
                    value={line.subjectName}
                  />
                </li>
              );
            })}
          </ul>

          {!lines.length && (
            <p className="login-warning">Belum ada. Darjah → kelas → subjek → Tambah.</p>
          )}
        </>
      )}

      {status === 'error' && <p className="capture-error">{error}</p>}

      <button
        className="primary-action"
        disabled={status === 'saving' || !validLines.length}
        onClick={() => void handleSave()}
        style={{ marginTop: '0.75rem', width: '100%' }}
        type="button"
      >
        {status === 'saving' ? 'Menyimpan…' : `Simpan setup (${validLines.length})`}
      </button>
    </div>
  );
}