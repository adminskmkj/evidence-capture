import { useMemo, useState } from 'react';
import { saveSubjects, type SubjectSaveRow } from '../api/appsScriptClient';
import { proposeSubjectsFromClasses, proposeSubjectsFromImportRows, subjectsToApiPayload } from '../data/subjectSetup';
import { slugId } from '../data/userData';
import type { ClassGroup, Subject } from '../types/domain';

export interface SubjectDraft {
  key: string;
  yearLevel: string;
  jenisKelas: string;
  classNames: string[];
  subjectName: string;
  enabled: boolean;
}

interface SubjectSetupPanelProps {
  classes: ClassGroup[];
  existingSubjects: Subject[];
  onSaved: () => void;
}

export function SubjectSetupPanel({ classes, existingSubjects, onSaved }: SubjectSetupPanelProps) {
  const [drafts, setDrafts] = useState<SubjectDraft[]>(() => subjectsToDrafts(existingSubjects, classes));
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  const activeCount = useMemo(() => drafts.filter((d) => d.enabled && d.subjectName.trim()).length, [drafts]);

  function generateFromClasses() {
    const proposals = proposeSubjectsFromClasses(classes);
    setDrafts(
      proposals.map((p) => ({
        ...p,
        subjectName: '',
        enabled: true,
      })),
    );
  }

  function updateDraft(key: string, patch: Partial<SubjectDraft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addManualRow() {
    const key = `manual-${Date.now()}`;
    setDrafts((prev) => [
      ...prev,
      {
        key,
        yearLevel: '—',
        jenisKelas: '—',
        classNames: classes.length === 1 ? [classes[0].class_name] : [],
        subjectName: '',
        enabled: true,
      },
    ]);
  }

  async function handleSave() {
    const toSave = drafts.filter((d) => d.enabled && d.subjectName.trim());
    if (!toSave.length) {
      setError('Isi nama subjek sekurang-kurangnya satu baris.');
      setStatus('error');
      return;
    }

    const classNameToId = new Map(classes.map((c) => [c.class_name, c.class_id]));
    const subjects: Subject[] = toSave.map((d) => ({
      subject_id: slugId(`${d.subjectName}-${d.yearLevel}-${d.jenisKelas}`),
      subject_name: d.subjectName.trim(),
      year_level: d.yearLevel,
      jenis_kelas: d.jenisKelas !== '—' ? d.jenisKelas : undefined,
      class_ids: d.classNames.map((n) => classNameToId.get(n)).filter((id): id is string => !!id),
      active: true,
    }));

    const payload: SubjectSaveRow[] = subjectsToApiPayload(subjects, classes).map((s) => ({
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
        Setiap guru lain subjek &amp; kelas. <strong>Jana dari kelas</strong> ikut kumpulan JENIS + TAHUN dari Excel, kemudian isi nama subjek (contoh Muzik, Sains).
      </p>
      <div className="import-class-actions">
        <button className="form-chip" disabled={!classes.length} onClick={generateFromClasses} type="button">
          Jana cadangan dari kelas
        </button>
        <button className="form-chip" onClick={addManualRow} type="button">
          + Tambah subjek manual
        </button>
      </div>

      {!drafts.length && (
        <p className="login-warning">Tiada subjek lagi. Muat naik murid dulu, kemudian klik Jana cadangan.</p>
      )}

      <ul className="subject-draft-list">
        {drafts.map((d) => (
          <li className="subject-draft-row" key={d.key}>
            <label className="import-class-row">
              <input
                checked={d.enabled}
                onChange={(e) => updateDraft(d.key, { enabled: e.target.checked })}
                type="checkbox"
              />
              <span className="import-class-meta">
                {d.jenisKelas !== '—' ? d.jenisKelas : 'Jenis —'}
                {d.yearLevel !== '—' ? ` · ${d.yearLevel}` : ''}
                {' · '}
                {d.classNames.length} kelas
              </span>
            </label>
            <input
              className="form-input"
              onChange={(e) => updateDraft(d.key, { subjectName: e.target.value })}
              placeholder="Nama subjek (cth: Muzik)"
              type="text"
              value={d.subjectName}
            />
            <p className="context-note" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              Kelas: {d.classNames.slice(0, 4).join(', ')}
              {d.classNames.length > 4 ? ` +${d.classNames.length - 4}` : ''}
            </p>
          </li>
        ))}
      </ul>

      {status === 'error' && <p className="capture-error">{error}</p>}

      <button
        className="primary-action"
        disabled={status === 'saving' || !activeCount}
        onClick={() => void handleSave()}
        style={{ marginTop: '0.75rem' }}
        type="button"
      >
        {status === 'saving' ? 'Menyimpan…' : `Simpan ${activeCount} subjek`}
      </button>
    </div>
  );
}

function subjectsToDrafts(subjects: Subject[], classes: ClassGroup[]): SubjectDraft[] {
  const idToName = new Map(classes.map((c) => [c.class_id, c.class_name]));
  return subjects.map((s) => ({
    key: s.subject_id,
    yearLevel: s.year_level,
    jenisKelas: s.jenis_kelas || '—',
    classNames: s.class_ids.map((id) => idToName.get(id) || '').filter(Boolean),
    subjectName: s.subject_name,
    enabled: true,
  }));
}

export function buildSubjectDraftsFromRows(
  rows: { className: string; classType: string; yearLevel?: string }[],
): SubjectDraft[] {
  return proposeSubjectsFromImportRows(
    rows.map((r) => ({
      className: r.className,
      classType: r.classType,
      yearLevel: r.yearLevel || '—',
    })),
  ).map((p) => ({ ...p, enabled: true }));
}

export async function saveSubjectDrafts(
  drafts: SubjectDraft[],
  classes: ClassGroup[],
): Promise<{ ok: boolean; error?: string }> {
  const toSave = drafts.filter((d) => d.enabled && d.subjectName.trim());
  if (!toSave.length) return { ok: false, error: 'Tiada subjek untuk disimpan' };

  const classNameToId = new Map(classes.map((c) => [c.class_name, c.class_id]));
  const subjects: Subject[] = toSave.map((d) => ({
    subject_id: slugId(`${d.subjectName}-${d.yearLevel}-${d.jenisKelas}`),
    subject_name: d.subjectName.trim(),
    year_level: d.yearLevel,
    jenis_kelas: d.jenisKelas !== '—' ? d.jenisKelas : undefined,
    class_ids: d.classNames.map((n) => classNameToId.get(n)).filter((id): id is string => !!id),
    active: true,
  }));

  const payload: SubjectSaveRow[] = subjectsToApiPayload(subjects, classes).map((s) => ({
    subject_id: s.subject_id || '',
    subject_name: s.subject_name || '',
    year_level: s.year_level || '',
    jenis_kelas: s.jenis_kelas || '',
    class_names: s.class_names || [],
  }));

  return saveSubjects(payload, { replaceAll: false });
}