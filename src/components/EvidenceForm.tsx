import { useState, useMemo } from 'react';
import { getClassesForSubject, getStudentsByClassId, subjects } from '../data/seed';
import type { ClassGroup, Student } from '../types/domain';

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
}

export function EvidenceForm({
  initialSubjectId = '',
  initialClassId = '',
  onSubmit,
}: EvidenceFormProps) {
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [classId, setClassId] = useState(initialClassId);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [activityTitle, setActivityTitle] = useState('');
  const [notes, setNotes] = useState('');

  const availableClasses: ClassGroup[] = useMemo(
    () => (subjectId ? getClassesForSubject(subjectId) : []),
    [subjectId],
  );

  const availableStudents: Student[] = useMemo(
    () => (classId ? getStudentsByClassId(classId) : []),
    [classId],
  );

  const isValid =
    subjectId !== '' &&
    classId !== '' &&
    studentIds.length > 0 &&
    activityTitle.trim().length > 0;

  function handleSubjectChange(newSubjectId: string) {
    setSubjectId(newSubjectId);
    setClassId('');
    setStudentIds([]);
  }

  function handleClassChange(newClassId: string) {
    setClassId(newClassId);
    setStudentIds([]);
  }

  function handleStudentToggle(studentId: string) {
    setStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  }

  function handleSelectAllStudents() {
    if (studentIds.length === availableStudents.length) {
      setStudentIds([]);
    } else {
      setStudentIds(availableStudents.map((s) => s.student_id));
    }
  }

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({
      subjectId,
      classId,
      studentIds,
      activityTitle: activityTitle.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="evidence-form">
      <fieldset className="form-group">
        <legend>Subjek</legend>
        <div className="form-chips">
          {subjects.map((s) => (
            <button
              className={`form-chip ${subjectId === s.subject_id ? 'form-chip--active' : ''}`}
              key={s.subject_id}
              onClick={() => handleSubjectChange(s.subject_id)}
              type="button"
            >
              {s.subject_name}
            </button>
          ))}
        </div>
      </fieldset>

      {subjectId && (
        <fieldset className="form-group">
          <legend>Kelas</legend>
          <div className="form-chips">
            {availableClasses.map((c) => (
              <button
                className={`form-chip ${classId === c.class_id ? 'form-chip--active' : ''}`}
                key={c.class_id}
                onClick={() => handleClassChange(c.class_id)}
                type="button"
              >
                {c.class_name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {classId && (
        <fieldset className="form-group">
          <legend>
            Murid{' '}
            <button
              className="form-chip form-chip--small"
              onClick={handleSelectAllStudents}
              type="button"
            >
              {studentIds.length === availableStudents.length ? 'Nyahpilih semua' : 'Pilih semua'}
            </button>
          </legend>
          <div className="form-chips">
            {availableStudents.map((stu) => (
              <button
                className={`form-chip ${studentIds.includes(stu.student_id) ? 'form-chip--active' : ''}`}
                key={stu.student_id}
                onClick={() => handleStudentToggle(stu.student_id)}
                type="button"
              >
                {stu.student_name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="form-group">
        <legend>Tajuk Aktiviti *</legend>
        <input
          className="form-input"
          onChange={(e) => setActivityTitle(e.target.value)}
          placeholder="Contoh: Eksperimen magnet"
          type="text"
          value={activityTitle}
        />
      </fieldset>

      <fieldset className="form-group">
        <legend>Catatan</legend>
        <textarea
          className="form-textarea"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan pentaksiran (pilihan)"
          rows={3}
          value={notes}
        />
      </fieldset>

      <div className="form-actions">
        <button
          className="primary-action"
          disabled={!isValid}
          onClick={handleSubmit}
          type="button"
        >
          Seterusnya: Ambil Gambar / Rakam Video
        </button>
        {!isValid && (
          <p className="form-hint">
            Sila pilih subjek, kelas, sekurang-kurangnya seorang murid, dan isi tajuk aktiviti.
          </p>
        )}
      </div>
    </div>
  );
}
