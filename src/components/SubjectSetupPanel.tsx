import { useMemo, useState } from 'react';
import { saveSubjects, type SubjectSaveRow } from '../api/appsScriptClient';
import {
  type ClassSubjectLine,
  linesFromSubjects,
  subjectsFromClassSubjectLines,
  subjectsToApiPayload,
} from '../data/subjectSetup';
import type { ClassGroup, Subject } from '../types/domain';
import { SelectPopup } from './SelectPopup';
import { formatYearLevelDisplay } from '../data/darjah';

interface SubjectSetupPanelProps {
  allClasses: ClassGroup[];
  existingSubjects: Subject[];
  onSaved: () => void;
}

export function SubjectSetupPanel({ allClasses, existingSubjects, onSaved }: SubjectSetupPanelProps) {
  const [lines, setLines] = useState<ClassSubjectLine[]>(() => linesFromSubjects(existingSubjects, allClasses));
  const [pickClassId, setPickClassId] = useState('');
  const [pickSubject, setPickSubject] = useState('');
  const [classPopupOpen, setClassPopupOpen] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const classById = useMemo(() => new Map(allClasses.map((c) => [c.class_id, c])), [allClasses]);
  const pickedClass = pickClassId ? classById.get(pickClassId) : undefined;
  const validLines = useMemo(() => lines.filter((l) => l.classId && l.subjectName.trim()), [lines]);

  const filteredClasses = useMemo(() => {
    const q = classFilter.trim().toLowerCase();
    if (!q) return allClasses;
    return allClasses.filter((c) => c.class_name.toLowerCase().includes(q));
  }, [allClasses, classFilter]);

  function pickClass(id: string) {
    setPickClassId(id);
    setClassPopupOpen(false);
    setError('');
    setStatus('idle');
  }

  function addLine() {
    const classId = pickClassId;
    const subjectName = pickSubject.trim();
    if (!classId) {
      setError('Langkah 1: pilih kelas dulu (butang biru di bawah).');
      setStatus('error');
      setClassPopupOpen(true);
      return;
    }
    if (!subjectName) {
      setError('Langkah 2: isi nama subjek.');
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
          Tiada kelas dalam Sheet. Scroll ke atas → <strong>Muat naik Excel</strong> murid dulu.
        </p>
      ) : (
        <>
          <div className="setup-step-block">
            <h4 className="setup-step-title">① Pilih kelas (yang anda ajar)</h4>
            <button
              className="select-trigger setup-class-pick"
              onClick={() => setClassPopupOpen(true)}
              type="button"
            >
              {pickedClass ? (
                <span>
                  {pickedClass.class_name}
                  {pickedClass.year_level !== '—' ? ` · ${formatYearLevelDisplay(pickedClass.year_level)}` : ''}
                </span>
              ) : (
                <span className="select-trigger__placeholder">Ketik sini — pilih dari {allClasses.length} kelas</span>
              )}
            </button>
          </div>

          <SelectPopup onClose={() => setClassPopupOpen(false)} open={classPopupOpen} title="Pilih kelas">
            <input
              className="form-input"
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Cari nama kelas…"
              style={{ marginBottom: '0.75rem', width: '100%' }}
              type="search"
              value={classFilter}
            />
            <ul className="import-class-list setup-class-popup-list">
              {filteredClasses.map((c) => (
                <li key={c.class_id}>
                  <button
                    className={`popup-item setup-class-pick-item ${pickClassId === c.class_id ? 'popup-item--active' : ''}`}
                    onClick={() => pickClass(c.class_id)}
                    type="button"
                  >
                    <span className="import-class-name">{c.class_name}</span>
                    <span className="import-class-meta">
                      {c.jenis_kelas ? `${c.jenis_kelas} · ` : ''}
                      {formatYearLevelDisplay(c.year_level)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!filteredClasses.length && <p className="context-note">Tiada padanan carian.</p>}
          </SelectPopup>

          <div className="setup-step-block">
            <h4 className="setup-step-title">② Subjek untuk kelas itu</h4>
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
              Kelas sama, subjek lain? Pilih kelas yang sama lagi, isi subjek lain, Tambah.
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
            <p className="login-warning">Belum ada. ① pilih kelas → ② isi subjek → Tambah.</p>
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