import { useMemo, useState } from 'react';
import { saveSubjects, type SubjectSaveRow } from '../api/appsScriptClient';
import {
  type ClassSubjectLine,
  linesFromSubjects,
  subjectsFromClassSubjectLines,
  subjectsToApiPayload,
} from '../data/subjectSetup';
import type { ClassGroup, Subject } from '../types/domain';

interface SubjectSetupPanelProps {
  /** Semua kelas dalam Sheet (untuk pilih); app lain hanya tunjuk yang dalam setup. */
  allClasses: ClassGroup[];
  existingSubjects: Subject[];
  onSaved: () => void;
}

export function SubjectSetupPanel({ allClasses, existingSubjects, onSaved }: SubjectSetupPanelProps) {
  const [lines, setLines] = useState<ClassSubjectLine[]>(() => linesFromSubjects(existingSubjects, allClasses));
  const [pickClassId, setPickClassId] = useState('');
  const [pickSubject, setPickSubject] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const classById = useMemo(() => new Map(allClasses.map((c) => [c.class_id, c])), [allClasses]);
  const validLines = useMemo(() => lines.filter((l) => l.classId && l.subjectName.trim()), [lines]);

  function addLine() {
    const classId = pickClassId;
    const subjectName = pickSubject.trim();
    if (!classId) {
      setError('Pilih kelas dulu.');
      setStatus('error');
      return;
    }
    if (!subjectName) {
      setError('Isi nama subjek.');
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
      <p className="context-note">
        Senarai murid Excel mungkin banyak kelas — di sini anda pilih <strong>kelas yang anda ajar sahaja</strong> dan
        subjek untuk setiap kelas. Kelas sama boleh ditambah dua kali dengan subjek berbeza (contoh Muzik &amp; Seni).
      </p>

      {allClasses.length === 0 ? (
        <p className="login-warning">Tiada kelas dalam Sheet. Muat naik Excel murid dulu.</p>
      ) : (
        <>
          <div className="class-subject-add">
            <label className="form-group" style={{ flex: 1 }}>
              <span className="context-note">Kelas</span>
              <select
                className="form-input"
                onChange={(e) => setPickClassId(e.target.value)}
                value={pickClassId}
              >
                <option value="">— Pilih kelas —</option>
                {allClasses.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name}
                    {c.year_level !== '—' ? ` (${c.year_level})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group" style={{ flex: 1 }}>
              <span className="context-note">Subjek</span>
              <input
                className="form-input"
                onChange={(e) => setPickSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLine();
                  }
                }}
                placeholder="cth: Muzik"
                type="text"
                value={pickSubject}
              />
            </label>
            <button className="primary-action" onClick={addLine} type="button">
              + Tambah
            </button>
          </div>

          <p className="context-note" style={{ marginTop: '0.5rem' }}>
            {allClasses.length} kelas dalam Sheet · anda ajar <strong>{new Set(validLines.map((l) => l.classId)).size}</strong>{' '}
            kelas · <strong>{validLines.length}</strong> baris subjek
          </p>

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
                  {c && (
                    <span className="import-class-meta">
                      {c.jenis_kelas ? `${c.jenis_kelas} · ` : ''}
                      {c.year_level !== '—' ? c.year_level : ''}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {!lines.length && (
            <p className="login-warning">Belum ada setup. Pilih kelas + subjek, klik Tambah.</p>
          )}
        </>
      )}

      {status === 'error' && <p className="capture-error">{error}</p>}

      <button
        className="primary-action"
        disabled={status === 'saving' || !validLines.length}
        onClick={() => void handleSave()}
        style={{ marginTop: '0.75rem' }}
        type="button"
      >
        {status === 'saving' ? 'Menyimpan…' : `Simpan setup (${validLines.length})`}
      </button>
    </div>
  );
}