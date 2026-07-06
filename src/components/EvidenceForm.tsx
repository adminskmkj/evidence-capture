import { useState, useMemo } from 'react';
import { useUserData } from '../context/UserDataContext';
import { SelectPopup } from './SelectPopup';

export interface EvidenceFormData {
  subjectId: string;
  classId: string;
  studentIds: string[];
  activityTitle: string;
  notes: string;
}

interface EvidenceFormProps {
  initialSubjectId?: string;
  initialClassId?: string;
  onSubmit: (data: EvidenceFormData) => void;
  onOpenImport?: () => void;
}

export function EvidenceForm({ initialSubjectId = '', initialClassId = '', onSubmit, onOpenImport }: EvidenceFormProps) {
  const { classes, subjects, getStudentsByClassId, loading } = useUserData();
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [classId, setClassId] = useState(initialClassId);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [activityTitle, setActivityTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [popup, setPopup] = useState<'subject' | 'class' | 'students' | null>(null);

  const availableStudents = useMemo(() => (classId ? getStudentsByClassId(classId) : []), [classId, getStudentsByClassId]);

  const isValid = subjectId !== '' && classId !== '' && studentIds.length > 0 && activityTitle.trim().length > 0;
  const subjectName = subjects.find((s) => s.subject_id === subjectId)?.subject_name || '';
  const className = classes.find((c) => c.class_id === classId)?.class_name || '';

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({ subjectId, classId, studentIds, activityTitle: activityTitle.trim(), notes: notes.trim() });
  }

  return (
    <div className="evidence-form">
      <fieldset className="form-group">
        <legend>Subjek</legend>
        <button className="select-trigger" onClick={() => setPopup('subject')} type="button">
          {subjectName || <span className="select-trigger__placeholder">Pilih subjek</span>}
        </button>
      </fieldset>

      <fieldset className="form-group">
        <legend>Kelas (senarai anda)</legend>
        {loading && <p className="context-note">Memuatkan kelas…</p>}
        {!loading && classes.length === 0 && (
          <p className="capture-error">
            Tiada kelas.{' '}
            {onOpenImport && (
              <button className="text-button" onClick={onOpenImport} type="button">
                Muat naik Excel
              </button>
            )}
          </p>
        )}
        {classes.length > 0 && (
          <button className="select-trigger" onClick={() => setPopup('class')} type="button">
            {className || <span className="select-trigger__placeholder">Pilih kelas</span>}
          </button>
        )}
      </fieldset>

      {classId && (
        <fieldset className="form-group">
          <legend>Murid ({studentIds.length} dipilih)</legend>
          <button className="select-trigger" onClick={() => setPopup('students')} type="button">
            {studentIds.length > 0
              ? `${studentIds.length} murid dipilih`
              : <span className="select-trigger__placeholder">Pilih murid</span>}
          </button>
        </fieldset>
      )}

      <fieldset className="form-group">
        <legend>Tajuk Aktiviti *</legend>
        <input className="form-input" onChange={(e) => setActivityTitle(e.target.value)} placeholder="Contoh: Eksperimen magnet" type="text" value={activityTitle} />
      </fieldset>

      <fieldset className="form-group">
        <legend>Catatan</legend>
        <textarea className="form-textarea" onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pentaksiran (pilihan)" rows={3} value={notes} />
      </fieldset>

      <SelectPopup open={popup === 'subject'} title="Pilih Subjek" onClose={() => setPopup(null)}>
        {subjects.map((s) => (
          <button
            className={`popup-item ${subjectId === s.subject_id ? 'popup-item--active' : ''}`}
            key={s.subject_id}
            onClick={() => { setSubjectId(s.subject_id); setPopup(null); }}
            type="button"
          >{s.subject_name}</button>
        ))}
      </SelectPopup>

      <SelectPopup open={popup === 'class'} title="Pilih Kelas" onClose={() => setPopup(null)}>
        {classes.map((c) => (
          <button
            className={`popup-item ${classId === c.class_id ? 'popup-item--active' : ''}`}
            key={c.class_id}
            onClick={() => { setClassId(c.class_id); setStudentIds([]); setPopup(null); }}
            type="button"
          >{c.class_name}{c.year_level !== '—' ? ` (${c.year_level})` : ''}</button>
        ))}
      </SelectPopup>

      <SelectPopup open={popup === 'students'} title="Pilih Murid" onClose={() => setPopup(null)}>
        <button className="popup-item popup-item--small" onClick={() => { if (studentIds.length === availableStudents.length) { setStudentIds([]); } else { setStudentIds(availableStudents.map((s) => s.student_id)); } }} type="button">
          {studentIds.length === availableStudents.length ? 'Nyahpilih semua' : 'Pilih semua'}
        </button>
        {availableStudents.map((stu) => (
          <button
            className={`popup-item ${studentIds.includes(stu.student_id) ? 'popup-item--active' : ''}`}
            key={stu.student_id}
            onClick={() => setStudentIds((prev) => prev.includes(stu.student_id) ? prev.filter((id) => id !== stu.student_id) : [...prev, stu.student_id])}
            type="button"
          >{stu.student_name}{studentIds.includes(stu.student_id) ? ' ✓' : ''}</button>
        ))}
      </SelectPopup>

      <div className="form-actions">
        <button className="primary-action" disabled={!isValid} onClick={handleSubmit} type="button">Seterusnya: Ambil Gambar / Rakam Video</button>
        {!isValid && <p className="form-hint">Sila pilih subjek, kelas, sekurang-kurangnya seorang murid, dan isi tajuk aktiviti.</p>}
      </div>
    </div>
  );
}