import { useMemo, useState } from 'react';
import { useUserData } from '../context/UserDataContext';
import { findTeachingSlot, formatTeachingSlotLabel } from '../data/subjectSetup';
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

export function EvidenceForm({
  initialSubjectId = '',
  initialClassId = '',
  onSubmit,
  onOpenImport,
}: EvidenceFormProps) {
  const { teachingSlots, getStudentsByClassId, loading } = useUserData();

  const initialSlot = useMemo(
    () => findTeachingSlot(teachingSlots, initialSubjectId, initialClassId)?.slot_id ?? '',
    [teachingSlots, initialSubjectId, initialClassId],
  );

  const [slotId, setSlotId] = useState(initialSlot);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [activityTitle, setActivityTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [popup, setPopup] = useState<'slot' | 'students' | null>(null);

  const selectedSlot = useMemo(
    () => teachingSlots.find((s) => s.slot_id === slotId),
    [teachingSlots, slotId],
  );

  const classId = selectedSlot?.class_id ?? '';

  const availableStudents = useMemo(
    () => (classId ? getStudentsByClassId(classId) : []),
    [classId, getStudentsByClassId],
  );

  const isValid =
    !!selectedSlot &&
    studentIds.length > 0 &&
    activityTitle.trim().length > 0;

  const slotLabel = selectedSlot ? formatTeachingSlotLabel(selectedSlot) : '';

  function handleSubmit() {
    if (!isValid || !selectedSlot) return;
    onSubmit({
      subjectId: selectedSlot.subject_id,
      classId: selectedSlot.class_id,
      studentIds,
      activityTitle: activityTitle.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="evidence-form">
      <fieldset className="form-group">
        <legend>Subjek &amp; kelas (ikut setup Tetapan)</legend>
        {loading && <p className="context-note">Memuatkan…</p>}
        {!loading && teachingSlots.length === 0 && (
          <p className="capture-error">
            Tiada kombinasi subjek+kelas. Dalam <strong>Tetapan → Setup kelas &amp; subjek</strong>, pilih kelas
            anda dan isi subjek (contoh SAINS), kemudian Simpan.
            {onOpenImport && (
              <>
                {' '}
                <button className="text-button" onClick={onOpenImport} type="button">
                  Import murid
                </button>
              </>
            )}
          </p>
        )}
        {teachingSlots.length > 0 && (
          <button className="select-trigger" onClick={() => setPopup('slot')} type="button">
            {slotLabel || <span className="select-trigger__placeholder">Pilih subjek &amp; kelas</span>}
          </button>
        )}
        {teachingSlots.length > 0 && (
          <p className="context-note" style={{ marginTop: '0.35rem' }}>
            Satu baris = satu subjek dalam satu kelas yang anda ajar ({teachingSlots.length} kombinasi).
          </p>
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

      <SelectPopup open={popup === 'slot'} title="Pilih subjek & kelas" onClose={() => setPopup(null)}>
        {teachingSlots.map((slot) => (
          <button
            className={`popup-item ${slotId === slot.slot_id ? 'popup-item--active' : ''}`}
            key={slot.slot_id}
            onClick={() => {
              setSlotId(slot.slot_id);
              setStudentIds([]);
              setPopup(null);
            }}
            type="button"
          >
            {formatTeachingSlotLabel(slot)}
          </button>
        ))}
      </SelectPopup>

      <SelectPopup open={popup === 'students'} title="Pilih Murid" onClose={() => setPopup(null)}>
        <button
          className="popup-item popup-item--small"
          onClick={() => {
            if (studentIds.length === availableStudents.length) {
              setStudentIds([]);
            } else {
              setStudentIds(availableStudents.map((s) => s.student_id));
            }
          }}
          type="button"
        >
          {studentIds.length === availableStudents.length ? 'Nyahpilih semua' : 'Pilih semua'}
        </button>
        {availableStudents.map((stu) => (
          <button
            className={`popup-item ${studentIds.includes(stu.student_id) ? 'popup-item--active' : ''}`}
            key={stu.student_id}
            onClick={() =>
              setStudentIds((prev) =>
                prev.includes(stu.student_id)
                  ? prev.filter((id) => id !== stu.student_id)
                  : [...prev, stu.student_id],
              )
            }
            type="button"
          >
            {stu.student_name}
            {studentIds.includes(stu.student_id) ? ' ✓' : ''}
          </button>
        ))}
      </SelectPopup>

      <div className="form-actions">
        <button className="primary-action" disabled={!isValid} onClick={handleSubmit} type="button">
          Seterusnya: Ambil Gambar / Rakam Video
        </button>
        {!isValid && (
          <p className="form-hint">
            Pilih kombinasi subjek+kelas dari setup anda, sekurang-kurangnya seorang murid, dan isi tajuk aktiviti.
          </p>
        )}
      </div>
    </div>
  );
}